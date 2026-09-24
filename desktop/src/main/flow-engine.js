/**
 * OpenMsg Visual Flow Builder Execution Engine
 * Evaluates visual graph nodes, branches, variables, and sessions
 * Compatible with Chrome Extension flow schema
 */

class FlowEngine {
  constructor({ db, sessionManager, emitLog }) {
    this.db = db;
    this.sessionManager = sessionManager;
    this.emitLog = emitLog || (() => {});
  }

  // Helper: Expand Spintax and variables
  renderText(text, variables = {}) {
    if (!text) return '';
    let rendered = String(text);

    // 1. Variable substitutions {{name}}, {name}, {{phone}}, etc.
    Object.entries(variables).forEach(([k, v]) => {
      const doubleReg = new RegExp(`{{${k}}}`, 'gi');
      rendered = rendered.replace(doubleReg, String(v ?? ''));
    });

    // Built-in date/time variables
    const now = new Date();
    rendered = rendered
      .replace(/{{time}}/gi, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      .replace(/{{date}}/gi, now.toLocaleDateString())
      .replace(/{{day}}/gi, now.toLocaleDateString([], { weekday: 'long' }));

    // 2. Spintax {Option 1|Option 2}
    rendered = rendered.replace(/{([^{}]+)}/g, (match, choices) => {
      if (!choices.includes('|')) return match; // avoid touching non-spintax single tokens
      const arr = choices.split('|');
      return arr[Math.floor(Math.random() * arr.length)];
    });

    return rendered;
  }

  // Check if a message matches a flow trigger
  matchesTrigger(trigger, body, isNewContact = false) {
    if (!trigger) return false;
    const text = String(body || '').trim().toLowerCase();

    if (trigger.type === 'any_message') return true;
    if (trigger.type === 'new_chat') return isNewContact;

    if (trigger.type === 'keyword' || !trigger.type) {
      const keywords = (trigger.keywords || []).map(k => String(k).trim().toLowerCase()).filter(Boolean);
      if (keywords.length === 0) return false;

      const matchType = trigger.match || 'contains';
      return keywords.some(k => {
        if (matchType === 'exact') return text === k;
        if (matchType === 'startswith') return text.startsWith(k);
        if (matchType === 'endswith') return text.endsWith(k);
        if (matchType === 'regex') {
          try { return new RegExp(k, 'i').test(text); } catch (e) { return false; }
        }
        return text.includes(k);
      });
    }

    return false;
  }

  // Handle incoming message from contact
  async handleIncoming({ accountId, phone, name, body }) {
    if (!phone || !body) return false;
    const cleanPhone = String(phone).replace(/\D+/g, '');

    let session = this.db.getFlowSession(cleanPhone);
    let flow = null;

    if (session) {
      flow = this.db.getFlow(session.flowId);
      if (!flow || !flow.enabled) {
        this.db.clearFlowSession(cleanPhone);
        session = null;
      }
    }

    // If no active session, evaluate triggers to start a new flow
    if (!session) {
      const enabledFlows = (this.db.getFlows() || []).filter(f => f.enabled);
      const isNewContact = (this.db.getChatMessages(cleanPhone) || []).length <= 1;

      for (const f of enabledFlows) {
        if (this.matchesTrigger(f.trigger, body, isNewContact)) {
          flow = f;
          const startNode = (f.nodes || []).find(n => n.type === 'start') || f.nodes[0];
          if (!startNode) continue;

          session = {
            flowId: f.id,
            currentNodeId: startNode.id,
            waitingForReply: false,
            variables: {
              phone: cleanPhone,
              senderPhone: cleanPhone,
              name: name || cleanPhone,
              firstMessage: body
            }
          };
          this.db.saveFlowSession(cleanPhone, session);
          break;
        }
      }
    }

    if (!session || !flow) return false;

    // Execute flow sequence
    await this.executeSession({ session, flow, incomingText: body, accountId, cleanPhone, name });
    return true;
  }

  // Core execution loop
  async executeSession({ session, flow, incomingText, accountId, cleanPhone, name }) {
    const nodes = flow.nodes || [];
    const edges = flow.edges || [];
    let currentNode = nodes.find(n => n.id === session.currentNodeId);
    if (!currentNode) {
      this.db.clearFlowSession(cleanPhone);
      return;
    }

    // If previously waiting for reply, process the reply first
    if (session.waitingForReply) {
      session.waitingForReply = false;
      let chosenHandle = 'next';

      // 1. If node had saveAs, record variable
      if (currentNode.data && currentNode.data.saveAs) {
        session.variables[currentNode.data.saveAs] = incomingText;
      }

      // 2. If node was buttons or list, match user choice
      if (currentNode.type === 'buttons' || currentNode.type === 'list') {
        const options = (currentNode.data?.buttons || currentNode.data?.sections?.[0]?.rows || []);
        const inputClean = incomingText.trim().toLowerCase();
        
        let matchIdx = -1;
        // Check exact text or numeric index (1, 2, 3...)
        options.forEach((opt, idx) => {
          const optText = (opt.text || opt.title || '').trim().toLowerCase();
          if (optText === inputClean || String(idx + 1) === inputClean) {
            matchIdx = idx;
          }
        });

        if (matchIdx >= 0) {
          chosenHandle = `option:${matchIdx}`;
          if (currentNode.data?.saveAs) {
            session.variables[currentNode.data.saveAs] = options[matchIdx].text || options[matchIdx].title;
          }
        } else {
          chosenHandle = 'default';
        }
      }

      // Find edge for chosen handle
      const edge = edges.find(e => e.from === currentNode.id && e.handle === chosenHandle) ||
                   edges.find(e => e.from === currentNode.id && e.handle === 'next');

      if (edge && edge.to) {
        currentNode = nodes.find(n => n.id === edge.to);
        session.currentNodeId = currentNode ? currentNode.id : null;
      } else {
        // No further path, end flow
        this.db.clearFlowSession(cleanPhone);
        return;
      }
    }

    // Step through non-blocking nodes
    let iterations = 0;
    while (currentNode && iterations < 30) {
      iterations++;
      session.currentNodeId = currentNode.id;
      const data = currentNode.data || {};

      switch (currentNode.type) {
        case 'start': {
          const edge = edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }

        case 'text': {
          const msgText = this.renderText(data.text, session.variables);
          if (msgText) {
            await this.sessionManager.execute('SEND_MESSAGE', {
              phone: cleanPhone,
              message: msgText,
              simulateTyping: Boolean(data.typingDelay),
              typingDurationMs: (data.typingDelay || 1) * 1000
            }, accountId);

            this.db.saveChatMessage({
              accountId,
              phone: cleanPhone,
              name: name || cleanPhone,
              fromMe: true,
              body: msgText,
              timestamp: Date.now()
            });

            this.emitLog({
              id: 'cblog_' + Date.now(),
              timestamp: Date.now(),
              senderPhone: cleanPhone,
              incomingText,
              replySource: `Flow: ${flow.name} (${currentNode.title || 'Text'})`,
              replyText: msgText,
              status: 'sent'
            });
          }

          if (data.wait) {
            session.waitingForReply = true;
            this.db.saveFlowSession(cleanPhone, session);
            return;
          }

          const edge = edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }

        case 'buttons':
        case 'list': {
          const prompt = this.renderText(data.text || 'Please choose an option:', session.variables);
          const options = (data.buttons || data.sections?.[0]?.rows || []);
          
          let menuMsg = prompt + '\n';
          options.forEach((opt, idx) => {
            menuMsg += `\n*${idx + 1}.* ${opt.text || opt.title}`;
          });
          menuMsg += '\n\n_Reply with the number or option title_';

          await this.sessionManager.execute('SEND_MESSAGE', {
            phone: cleanPhone,
            message: menuMsg,
            simulateTyping: true
          }, accountId);

          this.db.saveChatMessage({
            accountId,
            phone: cleanPhone,
            name: name || cleanPhone,
            fromMe: true,
            body: menuMsg,
            timestamp: Date.now()
          });

          session.waitingForReply = true;
          this.db.saveFlowSession(cleanPhone, session);
          return;
        }

        case 'condition': {
          let branchMatched = false;
          let matchedHandle = 'otherwise';

          const branches = data.branches || [];
          for (let bIdx = 0; bIdx < branches.length; bIdx++) {
            const branch = branches[bIdx];
            const rules = branch.rules || [];
            
            const passes = rules.every(rule => {
              const val = String(session.variables[rule.variable] ?? '').toLowerCase();
              const target = String(rule.value ?? '').toLowerCase();
              
              switch (rule.operator) {
                case 'equals': return val === target;
                case 'not_equals': return val !== target;
                case 'contains': return val.includes(target);
                case 'not_contains': return !val.includes(target);
                case 'starts_with': return val.startsWith(target);
                case 'ends_with': return val.endsWith(target);
                case 'gt': return parseFloat(val) > parseFloat(target);
                case 'lt': return parseFloat(val) < parseFloat(target);
                case 'is_empty': return !val;
                case 'is_not_empty': return Boolean(val);
                default: return val === target;
              }
            });

            if (passes && rules.length > 0) {
              branchMatched = true;
              matchedHandle = `cond:${bIdx}`;
              break;
            }
          }

          const edge = edges.find(e => e.from === currentNode.id && e.handle === matchedHandle) ||
                       edges.find(e => e.from === currentNode.id && e.handle === 'next');
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }

        case 'setVariable': {
          (data.entries || []).forEach(entry => {
            if (entry.name) {
              session.variables[entry.name] = this.renderText(entry.value, session.variables);
            }
          });
          const edge = edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }

        case 'delay': {
          const delaySec = Math.min(data.value || 3, 10);
          await new Promise(r => setTimeout(r, delaySec * 1000));
          const edge = edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }

        case 'webhook': {
          let webhookSuccess = false;
          if (data.url) {
            try {
              const https = data.url.startsWith('https') ? require('https') : require('http');
              const bodyJson = JSON.stringify(session.variables);
              const u = new URL(data.url);
              
              await new Promise((resolve) => {
                const req = https.request(u, {
                  method: data.method || 'POST',
                  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyJson) },
                  timeout: 5000
                }, (res) => {
                  let resBody = '';
                  res.on('data', chunk => resBody += chunk);
                  res.on('end', () => {
                    webhookSuccess = res.statusCode >= 200 && res.statusCode < 300;
                    try {
                      const parsed = JSON.parse(resBody);
                      Object.assign(session.variables, parsed);
                    } catch(e) {}
                    resolve();
                  });
                });
                req.on('error', () => resolve());
                req.on('timeout', () => { req.destroy(); resolve(); });
                req.write(bodyJson);
                req.end();
              });
            } catch(e) {}
          }
          const handle = webhookSuccess ? 'next' : 'fallback';
          const edge = edges.find(e => e.from === currentNode.id && e.handle === handle) ||
                       edges.find(e => e.from === currentNode.id && e.handle === 'next');
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }

        case 'tag':
        case 'action': {
          if (data.stageId) {
            // Move contact to Kanban Stage
            this.db.saveKanbanCard({
              phone: cleanPhone,
              name: name || cleanPhone,
              stageId: data.stageId,
              notes: `Moved by flow ${flow.name}`
            });
          }
          const edge = edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }

        case 'handoff': {
          const custMsg = this.renderText(data.customerMessage || 'Transferring you to a human agent...', session.variables);
          await this.sessionManager.execute('SEND_MESSAGE', {
            phone: cleanPhone,
            message: custMsg
          }, accountId);

          this.db.saveChatMessage({
            accountId,
            phone: cleanPhone,
            name: name || cleanPhone,
            fromMe: true,
            body: custMsg,
            timestamp: Date.now()
          });

          this.db.clearFlowSession(cleanPhone);
          return;
        }

        case 'end': {
          if (data.message) {
            const endMsg = this.renderText(data.message, session.variables);
            await this.sessionManager.execute('SEND_MESSAGE', {
              phone: cleanPhone,
              message: endMsg
            }, accountId);

            this.db.saveChatMessage({
              accountId,
              phone: cleanPhone,
              name: name || cleanPhone,
              fromMe: true,
              body: endMsg,
              timestamp: Date.now()
            });
          }
          this.db.clearFlowSession(cleanPhone);
          return;
        }

        default: {
          const edge = edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));
          currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
          break;
        }
      }
    }

    if (!currentNode) {
      this.db.clearFlowSession(cleanPhone);
    } else {
      session.currentNodeId = currentNode.id;
      this.db.saveFlowSession(cleanPhone, session);
    }
  }

  // Dry-run simulator for the UI
  async testStep(flow, currentNodeId, incomingText = '', currentVariables = {}) {
    const nodes = flow.nodes || [];
    const edges = flow.edges || [];
    const variables = { ...currentVariables };
    const logs = [];

    let currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) {
      currentNode = nodes.find(n => n.type === 'start') || nodes[0];
    }

    if (!currentNode) {
      return { done: true, logs: ['Flow has no valid start node'] };
    }

    // If incomingText was sent, user replied to currentNode. Transition first!
    if (incomingText) {
      const prevData = currentNode.data || {};
      if (prevData.saveAs) {
        variables[prevData.saveAs] = incomingText;
        logs.push(`Saved variable "${prevData.saveAs}" = "${incomingText}"`);
      }

      let chosenHandle = 'next';
      if (currentNode.type === 'buttons' || currentNode.type === 'list') {
        const options = (prevData.buttons || prevData.sections?.[0]?.rows || prevData.items || []);
        const inputClean = incomingText.trim().toLowerCase();
        let matchIdx = -1;
        options.forEach((opt, idx) => {
          const optText = (opt.text || opt.title || '').trim().toLowerCase();
          if (optText === inputClean || String(idx + 1) === inputClean) {
            matchIdx = idx;
          }
        });
        if (matchIdx >= 0) {
          chosenHandle = `option:${matchIdx}`;
          if (prevData.saveAs) {
            variables[prevData.saveAs] = options[matchIdx].text || options[matchIdx].title;
          }
        }
      }

      const edge = edges.find(e => e.from === currentNode.id && e.handle === chosenHandle) ||
                   edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));

      currentNode = edge ? nodes.find(n => n.id === edge.to) : null;
      if (!currentNode) {
        return { done: true, replyText: null, waitingForReply: false, variables, logs };
      }
    }

    // Now evaluate currentNode
    let nextNodeId = null;
    let replyText = null;
    let waitingForReply = false;
    const data = currentNode.data || {};

    if (currentNode.type === 'start') {
      const edge = edges.find(e => e.from === currentNode.id);
      nextNodeId = edge ? edge.to : null;
    } else if (currentNode.type === 'text') {
      replyText = this.renderText(data.text, variables);
      waitingForReply = Boolean(data.wait);
      const edge = edges.find(e => e.from === currentNode.id);
      nextNodeId = waitingForReply ? currentNode.id : (edge ? edge.to : null);
    } else if (currentNode.type === 'buttons' || currentNode.type === 'list') {
      replyText = this.renderText(data.text, variables);
      waitingForReply = true;
      nextNodeId = currentNode.id;
    } else if (currentNode.type === 'condition') {
      const varVal = String(variables[data.variable] ?? '').toLowerCase();
      const targetVal = String(data.value ?? '').toLowerCase();
      let matched = false;
      if (data.operator === 'equals') matched = (varVal === targetVal);
      else if (data.operator === 'contains') matched = varVal.includes(targetVal);
      else if (data.operator === 'startswith') matched = varVal.startsWith(targetVal);
      else if (data.operator === 'gt') matched = (parseFloat(varVal) > parseFloat(targetVal));
      else if (data.operator === 'lt') matched = (parseFloat(varVal) < parseFloat(targetVal));

      const edge = edges.find(e => e.from === currentNode.id && e.handle === (matched ? 'true' : 'false')) ||
                   edges.find(e => e.from === currentNode.id && e.handle === (matched ? 'option:0' : 'option:1')) ||
                   edges.find(e => e.from === currentNode.id && (e.handle === 'next' || !e.handle));
      nextNodeId = edge ? edge.to : null;
    } else if (currentNode.type === 'setVariable') {
      if (data.key) {
        variables[data.key] = this.renderText(data.value, variables);
      }
      const edge = edges.find(e => e.from === currentNode.id);
      nextNodeId = edge ? edge.to : null;
    } else if (currentNode.type === 'delay') {
      logs.push(`Delay ${data.seconds || 3}s simulated`);
      const edge = edges.find(e => e.from === currentNode.id);
      nextNodeId = edge ? edge.to : null;
    } else if (currentNode.type === 'action') {
      logs.push(`Moved lead to CRM stage: ${data.stage || 'qualified'}`);
      const edge = edges.find(e => e.from === currentNode.id);
      nextNodeId = edge ? edge.to : null;
    } else if (currentNode.type === 'end' || currentNode.type === 'handoff') {
      replyText = this.renderText(data.message || data.customerMessage || 'Flow finished.', variables);
      return { done: true, replyText, variables, logs };
    } else {
      const edge = edges.find(e => e.from === currentNode.id);
      nextNodeId = edge ? edge.to : null;
    }

    return {
      done: !nextNodeId && !waitingForReply,
      currentNodeId: nextNodeId,
      replyText,
      waitingForReply,
      variables,
      logs
    };
  }
}

module.exports = { FlowEngine };

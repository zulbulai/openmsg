/**
 * Automated Core Unit Tests for OpenMsg Desktop
 * Tests Spintax, SenderQueue, HWID/Licensing, Database, and AI Rules
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { parseSpintax, replaceVariables, preparePersonalizedMessage } = require('../src/shared/utils/spintax');
const { SenderQueue } = require('../src/shared/utils/sender-queue');
const { getHardwareId, generateLicenseKey, verifyLicenseKey } = require('../src/shared/utils/hwid');
const { LocalDatabase } = require('../src/main/database');
const { AiEngine } = require('../src/main/ai-engine');

test('Spintax Parser - Basic & Nested Variations', () => {
  const template = '{Hello|Hi|Greetings} friend!';
  const result = parseSpintax(template);
  assert.ok(['Hello friend!', 'Hi friend!', 'Greetings friend!'].includes(result), `Unexpected result: ${result}`);

  // Test nested spintax
  const nested = '{Good {morning|afternoon}|Welcome} user!';
  const nestedResult = parseSpintax(nested);
  assert.ok(
    ['Good morning user!', 'Good afternoon user!', 'Welcome user!'].includes(nestedResult),
    `Unexpected nested result: ${nestedResult}`
  );
});

test('Spintax & Variables - Full Personalization', () => {
  const template = '{Hey|Hello} {{Name}}, welcome to {{Company}}!';
  const contact = { Name: 'Jitendra', Company: 'OpenMsg' };
  const res = preparePersonalizedMessage(template, contact);

  assert.ok(
    ['Hey Jitendra, welcome to OpenMsg!', 'Hello Jitendra, welcome to OpenMsg!'].includes(res),
    `Personalized message mismatch: ${res}`
  );
});

test('HWID & Cryptographic Licensing System', () => {
  const hwid = getHardwareId();
  assert.match(hwid, /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

  // 1. Generate valid lifetime license key
  const validKey = generateLicenseKey(hwid, {
    customer: 'VIP Client',
    plan: 'PRO_ENTERPRISE',
    expiresAt: null
  });

  const checkValid = verifyLicenseKey(validKey, hwid);
  assert.equal(checkValid.valid, true);
  assert.equal(checkValid.plan, 'PRO_ENTERPRISE');
  assert.equal(checkValid.customer, 'VIP Client');
  assert.equal(checkValid.isLifetime, true);

  // 2. Test forged signature
  const forgedKey = validKey.slice(0, -4) + 'FFFF';
  const checkForged = verifyLicenseKey(forgedKey, hwid);
  assert.equal(checkForged.valid, false);
  assert.match(checkForged.reason, /signature/i);

  // 3. Test machine lock mismatch
  const wrongHwid = '9999-8888-7777-6666';
  const checkMismatch = verifyLicenseKey(validKey, wrongHwid);
  assert.equal(checkMismatch.valid, false);
  assert.match(checkMismatch.reason, /different machine/i);

  // 4. Test expired key
  const expiredKey = generateLicenseKey(hwid, {
    customer: 'Expired User',
    plan: 'PRO_MONTHLY',
    expiresAt: Date.now() - 10000 // 10s in the past
  });
  const checkExpired = verifyLicenseKey(expiredKey, hwid);
  assert.equal(checkExpired.valid, false);
  assert.match(checkExpired.reason, /expired/i);
});

test('SenderQueue - Anti-Ban Rate Limiting & Execution', async () => {
  const queue = new SenderQueue({
    minDelayMs: 10,
    maxDelayMs: 25,
    batchSize: 2,
    batchPauseMs: 50,
    simulateTyping: false
  });

  const mockItems = [
    { phone: '919876543210', Name: 'Alice' },
    { phone: '919876543211', Name: 'Bob' },
    { phone: '919876543212', Name: 'Charlie' }
  ];

  queue.setItems(mockItems, 'Hello {{Name}}');

  const dispatched = [];
  const completedPromise = new Promise(resolve => {
    queue.on('completed', (stats) => {
      resolve(stats);
    });
  });

  queue.start(async (item) => {
    dispatched.push(item);
  });

  const finalStats = await completedPromise;

  assert.equal(finalStats.total, 3);
  assert.equal(finalStats.sent, 3);
  assert.equal(finalStats.failed, 0);
  assert.equal(dispatched.length, 3);
  assert.equal(dispatched[0].phone, '919876543210');
  assert.equal(dispatched[0].message, 'Hello Alice');
});

test('LocalDatabase & AI Engine Rule Matching', () => {
  const tmpDbPath = path.join(__dirname, 'tmp_test_db.json');
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

  const db = new LocalDatabase(tmpDbPath);

  // Test account creation
  db.addAccount({ id: 'acc_1', name: 'Test WhatsApp', phone: '123456789' });
  assert.equal(db.getAccounts().length, 1);
  assert.equal(db.getAccounts()[0].name, 'Test WhatsApp');

  // Test AI Engine rules
  const aiEngine = new AiEngine(db);

  // Default welcome rule
  const matchHello = aiEngine.evaluateRules('Hello there!');
  assert.ok(matchHello);
  assert.match(matchHello.response, /How can we help/i);

  // Regex rule
  db.saveRules([
    {
      id: 'rule_regex',
      trigger: '^order #?[0-9]+',
      matchType: 'regex',
      response: 'Tracking your order now...',
      isActive: true
    }
  ]);

  const matchOrder = aiEngine.evaluateRules('Order #12345 status');
  assert.ok(matchOrder);
  assert.equal(matchOrder.response, 'Tracking your order now...');

  // Match types: exact, startswith, endswith
  db.saveRules([
    { id: 'r_exact', trigger: 'hi', matchType: 'exact', response: 'Exact Hi!', isActive: true },
    { id: 'r_starts', trigger: 'menu', matchType: 'startswith', response: 'Here is our menu', isActive: true },
    { id: 'r_ends', trigger: 'thanks', matchType: 'endswith', response: 'You are welcome!', isActive: true },
    { id: 'r_spintax', trigger: 'deal', matchType: 'contains', response: '{Hot|Best} deal for {{phone}}', isActive: true }
  ]);

  // Exact match
  assert.ok(aiEngine.evaluateRules('hi'));
  assert.equal(aiEngine.evaluateRules('hi there'), null); // should not match exact

  // StartsWith
  assert.ok(aiEngine.evaluateRules('menu items for lunch'));
  assert.equal(aiEngine.evaluateRules('see our menu'), null);

  // EndsWith
  assert.ok(aiEngine.evaluateRules('many thanks'));
  assert.equal(aiEngine.evaluateRules('thanks a lot'), null);

  // Spintax & Dynamic Variable evaluation
  const spintaxMatch = aiEngine.evaluateRules('What is the deal today?', { senderPhone: '919876543210' });
  assert.ok(spintaxMatch);
  assert.match(spintaxMatch.response, /(Hot|Best) deal for 919876543210/);

  // testRuleMatch dry-run
  const dryRun = aiEngine.testRuleMatch('what is the deal?', { phone: '12345' });
  assert.ok(dryRun.matched);
  assert.equal(dryRun.ruleId, 'r_spintax');

  // Inactive rule should not match
  db.saveRules([
    {
      id: 'rule_inactive',
      trigger: 'pricing',
      matchType: 'contains',
      response: 'Plans start at $10',
      isActive: false
    }
  ]);
  const matchInactive = aiEngine.evaluateRules('Can you tell me the pricing?');
  assert.equal(matchInactive, null);

  // Chatbot Logs persistence
  db.addChatbotLog({
    senderPhone: '919876543210',
    incomingText: 'hello',
    replySource: 'Rule: hello',
    replyText: 'Hi there!',
    status: 'sent'
  });
  const logs = db.getChatbotLogs();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].senderPhone, '919876543210');
  assert.equal(logs[0].status, 'sent');
  db.clearChatbotLogs();
  assert.equal(db.getChatbotLogs().length, 0);

  // Conversation history multi-turn memory
  db.appendConversationHistory('919876543210', { role: 'user', text: 'Do you sell laptops?' });
  db.appendConversationHistory('919876543210', { role: 'assistant', text: 'Yes, Dell and HP.' });
  const hist = db.getConversationHistory('919876543210');
  assert.equal(hist.length, 2);
  assert.equal(hist[0].role, 'user');
  assert.equal(hist[1].role, 'assistant');
  db.clearConversationHistory('919876543210');
  assert.equal(db.getConversationHistory('919876543210').length, 0);

  // Clean up
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
});

test('SenderQueue - Multi-Message Rotation & Interactive Buttons (Phase 7E)', async () => {
  const queue = new SenderQueue({
    minDelayMs: 5,
    maxDelayMs: 15,
    batchSize: 10,
    batchPauseMs: 50,
    simulateTyping: false
  });

  const mockContacts = [
    { phone: '1001', Name: 'User 1' },
    { phone: '1002', Name: 'User 2' },
    { phone: '1003', Name: 'User 3' },
    { phone: '1004', Name: 'User 4' }
  ];

  const variants = [
    'Variant A for {{Name}}',
    'Variant B for {{Name}}'
  ];

  const buttons = {
    type: 'link',
    text: 'Visit Site',
    url: 'https://openmsg.org'
  };

  // 1. Sequential Round-Robin Rotation
  queue.setItems(mockContacts, 'Default', [], {
    messages: variants,
    rotationMode: 'sequential',
    buttons: buttons
  });

  const sentPayloads = [];
  const completedPromise = new Promise(resolve => {
    queue.on('completed', resolve);
  });

  queue.start(async (item) => {
    sentPayloads.push(item);
  });

  await completedPromise;

  assert.equal(sentPayloads.length, 4);
  assert.equal(sentPayloads[0].message, 'Variant A for User 1');
  assert.equal(sentPayloads[1].message, 'Variant B for User 2');
  assert.equal(sentPayloads[2].message, 'Variant A for User 3');
  assert.equal(sentPayloads[3].message, 'Variant B for User 4');
  assert.deepEqual(sentPayloads[0].buttons, buttons);
});

test('Database - Phase 7 Leads, Warmer & Dashboard Stats', () => {
  const tmpDbPath = path.join(__dirname, 'tmp_phase7_db.json');
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

  const db = new LocalDatabase(tmpDbPath);

  // 1. Initial dashboard stats
  const initialStats = db.getDashboardStats();
  assert.equal(initialStats.totalAccounts, 0);
  assert.equal(initialStats.totalMapLeads, 0);
  assert.equal(initialStats.messagesSentToday, 0);

  // 2. Google Maps Leads
  const leads = [
    { name: 'Dr. Smile Dental', phone: '12125550199', address: '123 5th Ave', rating: '4.8', website: 'https://drsmile.com', city: 'NYC', keyword: 'Dentist' },
    { name: 'Apex Orthodontics', phone: '12125550200', address: '456 Madison Ave', rating: '4.9', website: '', city: 'NYC', keyword: 'Dentist' }
  ];
  const addRes = db.addMapLeads(leads);
  assert.equal(addRes.added, 2);
  assert.equal(db.getMapLeads().length, 2);

  // Deduplication check
  const dupRes = db.addMapLeads([leads[0]]);
  assert.equal(dupRes.added, 0);
  assert.equal(db.getMapLeads().length, 2);

  // 3. Warmer Stats & Config
  const cfg = db.getWarmerConfig();
  assert.equal(cfg.dailyTarget, 30);

  db.saveWarmerConfig({ dailyTarget: 50, minDelay: 30, maxDelay: 90 });
  assert.equal(db.getWarmerConfig().dailyTarget, 50);

  db.recordWarmerMessage('acc_1');
  db.recordWarmerMessage('acc_1');
  const wStats = db.getWarmerStats();
  assert.equal(wStats.accounts['acc_1'].sentToday, 2);
  assert.equal(wStats.accounts['acc_1'].totalAllTime, 2);
  assert.equal(wStats.totalSentToday, 2);

  // 4. Aggregated Dashboard Stats check
  const updatedStats = db.getDashboardStats();
  assert.equal(updatedStats.totalMapLeads, 2);
  assert.equal(updatedStats.messagesSentToday, 2);

  // Clear leads
  db.clearMapLeads();
  assert.equal(db.getMapLeads().length, 0);

  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
});

test('Group Link Extraction Pattern', () => {
  const sampleHtml = `
    <div>Check out our crypto group at https://chat.whatsapp.com/J9F7b2X9K1mL5p8Q0wR3tZ for signals!</div>
    <p>Another real estate group https://chat.whatsapp.com/A1B2C3D4E5F6G7H8I9J0kL and duplicate https://chat.whatsapp.com/J9F7b2X9K1mL5p8Q0wR3tZ</p>
  `;

  const regex = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9_-]{20,24})/gi;
  const found = new Set();
  let match;
  while ((match = regex.exec(sampleHtml)) !== null) {
    found.add(match[1]);
  }

  assert.equal(found.size, 2);
  assert.ok(found.has('J9F7b2X9K1mL5p8Q0wR3tZ'));
  assert.ok(found.has('A1B2C3D4E5F6G7H8I9J0kL'));
});

test('QR Code System - DataURL Generation & Offline Vendor Script', async () => {
  const QRCode = require('qrcode');
  const mockWaQr = '2@1B2C3D4E5F6G7H8I9J0kL1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z,TEST_SECRET_KEY,TEST_CLIENT_ID';

  // 1. Verify Node.js QRCode creates valid base64 PNG data URL
  const dataUrl = await QRCode.toDataURL(mockWaQr, { width: 280, margin: 1 });
  assert.ok(dataUrl.startsWith('data:image/png;base64,'), 'QR dataURL must start with PNG base64 header');
  assert.ok(dataUrl.length > 200, 'QR dataURL must contain image bytes');

  // 2. Verify offline local vendor script exists
  const vendorPath = path.join(__dirname, '../src/renderer/js/vendor/qrcode.min.js');
  assert.ok(fs.existsSync(vendorPath), 'Local vendor qrcode.min.js must exist for offline support');
  const vendorContent = fs.readFileSync(vendorPath, 'utf8');
  assert.ok(vendorContent.includes('QRCode'), 'Vendor script must define QRCode');
});

test('Live Chat & Inbox Persistence (Threads, Messages, Unread Count, Cleanup)', () => {
  const tmpDbPath = path.join(__dirname, 'test-livechat.json');
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

  const db = new LocalDatabase(tmpDbPath);

  // 1. Incoming message saves to thread and messages
  const res1 = db.saveChatMessage({
    accountId: 'acc_sales',
    phone: '919876543210',
    name: 'Alice Johnson',
    fromMe: false,
    body: 'Hello, need pricing details!',
    timestamp: 1000
  });
  assert.ok(res1);
  assert.equal(res1.thread.unreadCount, 1);
  assert.equal(res1.message.body, 'Hello, need pricing details!');
  assert.equal(res1.message.fromMe, false);

  // 2. Outgoing reply saves to same thread, does not increment unread
  const res2 = db.saveChatMessage({
    accountId: 'acc_sales',
    phone: '919876543210',
    name: 'Alice Johnson',
    fromMe: true,
    body: 'Hi Alice! Plans start at $19.',
    timestamp: 2000
  });
  assert.ok(res2);
  assert.equal(res2.thread.unreadCount, 1);
  assert.equal(res2.thread.lastMessage, 'Hi Alice! Plans start at $19.');

  // 3. Check threads list
  const threads = db.getChatThreads();
  assert.equal(threads.length, 1);
  assert.equal(threads[0].phone, '919876543210');
  assert.equal(threads[0].name, 'Alice Johnson');

  // Filter by accountId
  const salesThreads = db.getChatThreads('acc_sales');
  assert.equal(salesThreads.length, 1);
  const supportThreads = db.getChatThreads('acc_support');
  assert.equal(supportThreads.length, 0);

  // 4. Check messages
  const msgs = db.getChatMessages('919876543210');
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0].fromMe, false);
  assert.equal(msgs[1].fromMe, true);

  // 5. Mark as read
  db.markChatRead('919876543210');
  const readThreads = db.getChatThreads();
  assert.equal(readThreads[0].unreadCount, 0);

  // 6. Delete thread
  db.deleteChatThread('919876543210');
  assert.equal(db.getChatThreads().length, 0);
  assert.equal(db.getChatMessages('919876543210').length, 0);

  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
});

test('Flow Engine & Database - Flow CRUD, Branching & Simulator Execution', async () => {
  const { FlowEngine } = require('../src/main/flow-engine');
  const tmpDbPath = path.join(__dirname, 'test-flows-db.json');
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);

  const db = new LocalDatabase(tmpDbPath);

  // 1. Initial Starter Flow loaded by default
  const flows = db.getFlows();
  assert.ok(flows.length >= 1, 'Should have at least 1 starter flow');
  const starter = flows[0];
  assert.equal(starter.id, 'flow_welcome_lead');
  assert.equal(starter.nodes.length, 6);
  assert.equal(starter.edges.length, 5);

  // 2. Flow CRUD
  const customFlow = {
    id: 'flow_test_bot',
    name: 'Test Sales Bot',
    description: 'Unit test flow',
    trigger: {
      type: 'keyword',
      keywords: ['order', 'status'],
      match: 'exact',
      caseSensitive: false
    },
    enabled: true,
    nodes: [
      { id: 'n_start', type: 'start', title: 'Start', x: 0, y: 0, data: {} },
      { id: 'n_ask', type: 'buttons', title: 'Choices', x: 200, y: 0, data: {
        text: 'Hello {{name}}! Please select your order query:',
        buttons: [{ id: 'b1', text: 'Track Order' }, { id: 'b2', text: 'Cancel Order' }],
        saveAs: 'selected_query'
      }},
      { id: 'n_track', type: 'text', title: 'Track', x: 400, y: 0, data: { text: 'Your order is in transit!', wait: false }},
      { id: 'n_cancel', type: 'action', title: 'Cancel Stage', x: 400, y: 150, data: { action: 'move_stage', stage: 'lost' }}
    ],
    edges: [
      { id: 'e1', from: 'n_start', handle: 'next', to: 'n_ask' },
      { id: 'e2', from: 'n_ask', handle: 'option:0', to: 'n_track' },
      { id: 'e3', from: 'n_ask', handle: 'option:1', to: 'n_cancel' }
    ]
  };

  db.saveFlow(customFlow);
  assert.equal(db.getFlow('flow_test_bot').name, 'Test Sales Bot');

  // Toggle & Duplicate
  db.toggleFlow('flow_test_bot', false);
  assert.equal(db.getFlow('flow_test_bot').enabled, false);

  const dup = db.duplicateFlow('flow_test_bot');
  assert.ok(dup.id !== 'flow_test_bot');
  assert.match(dup.name, /Copy/);

  // 3. FlowEngine Execution & Trigger Match
  const engine = new FlowEngine({ db, sessionManager: { execute: async () => {} } });

  assert.equal(engine.matchesTrigger(customFlow.trigger, 'order'), true);
  assert.equal(engine.matchesTrigger(customFlow.trigger, 'order please'), false); // exact match mode
  assert.equal(engine.matchesTrigger({ type: 'any_message' }, 'random'), true);
  assert.equal(engine.matchesTrigger({ type: 'new_chat' }, 'hello', true), true);
  assert.equal(engine.matchesTrigger({ type: 'new_chat' }, 'hello', false), false);

  // 4. Simulator Dry-runner Test Step
  // Step 1: Start node -> advances to ask node
  const step1 = await engine.testStep(customFlow, 'n_start', '', { name: 'Jitendra' });
  assert.equal(step1.done, false);
  assert.equal(step1.currentNodeId, 'n_ask');
  assert.equal(step1.waitingForReply, false);

  // Step 2: Ask node -> prompts buttons and waits for reply
  const step2 = await engine.testStep(customFlow, 'n_ask', '', { name: 'Jitendra' });
  assert.equal(step2.done, false);
  assert.equal(step2.waitingForReply, true);
  assert.match(step2.replyText, /Hello Jitendra! Please select your order query/);

  // Step 3: User picks 'Track Order'
  const step3 = await engine.testStep(customFlow, 'n_ask', 'Track Order', step2.variables);
  assert.equal(step3.variables.selected_query, 'Track Order');
  assert.equal(step3.replyText, 'Your order is in transit!');
  assert.equal(step3.done, true);

  // Cleanup
  db.deleteFlow('flow_test_bot');
  db.deleteFlow(dup.id);
  assert.equal(db.getFlow('flow_test_bot'), null);

  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
});



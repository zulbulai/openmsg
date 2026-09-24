/**
 * OpenMsg Visual Flow Builder & Chatbot Workflows Controller
 * Full visual graph studio: Drag-and-drop nodes, Bezier wire connections,
 * Inspector drawer, Multi-step execution, and WhatsApp Sandbox Simulator.
 */

(function () {
  'use strict';

  // ─── Pre-built Flow Templates ──────────────────────────────────────────
  const FLOW_TEMPLATES = {
    lead: {
      name: 'Lead Qualification & Sales',
      description: 'Engages inbound leads, presents service choices, and auto-qualifies them into the CRM pipeline.',
      trigger: {
        type: 'keyword',
        keywords: ['hi', 'hello', 'price', 'pricing', 'quote', 'services'],
        match: 'contains',
        caseSensitive: false
      },
      enabled: true,
      nodes: [
        {
          id: 'node_start',
          type: 'start',
          title: 'Start Conversation',
          x: 60,
          y: 120,
          data: {}
        },
        {
          id: 'node_welcome',
          type: 'text',
          title: 'Welcome Greeting',
          x: 340,
          y: 120,
          data: {
            text: '{Hello|Hi|Greetings} {{name}}! 👋 Welcome to our official WhatsApp sales desk.\nHow can our team empower your business today?',
            typingDelay: 1,
            wait: false
          }
        },
        {
          id: 'node_menu',
          type: 'buttons',
          title: 'Select Service Requirement',
          x: 660,
          y: 120,
          data: {
            text: 'Please choose an option below to get instant information or speak with an advisor:',
            buttons: [
              { id: 'b1', text: '💼 View Products' },
              { id: 'b2', text: '💰 Pricing & Licensing' },
              { id: 'b3', text: '👨‍💼 Speak with Advisor' }
            ],
            saveAs: 'selected_requirement'
          }
        },
        {
          id: 'node_products_info',
          type: 'text',
          title: 'Products Overview',
          x: 1020,
          y: 30,
          data: {
            text: '🚀 *OpenMsg WhatsApp Automation Suite:*\n\n1. High-Speed Bulk Campaign Dispatcher with Anti-Ban\n2. Google Maps B2B Lead Scraper\n3. Visual Multi-Step Chatbot Flow Builder\n4. Multi-Account Live Chat & CRM Kanban Pipeline\n\nAll tools are included with Community Edition.',
            wait: false
          }
        },
        {
          id: 'node_crm_qualify',
          type: 'action',
          title: 'Move to Qualified',
          x: 1360,
          y: 30,
          data: {
            action: 'move_stage',
            stage: 'qualified'
          }
        },
        {
          id: 'node_pricing_info',
          type: 'text',
          title: 'Pricing & Community Pro',
          x: 1020,
          y: 190,
          data: {
            text: '💎 *OpenMsg Community Edition is 100% FREE & UNLOCKED!*\nAll Pro features, unlimited numbers, and anti-ban safeguards are permanently active without license fees.\n\nType *hi* anytime to see the main menu again.',
            wait: false
          }
        },
        {
          id: 'node_advisor_handoff',
          type: 'handoff',
          title: 'Human Advisor Handoff',
          x: 1020,
          y: 360,
          data: {
            customerMessage: 'Connecting you with our senior client advisor right now. Please hold on a moment! 🔔',
            agentMessage: 'Customer {{phone}} requested live sales advisor assistance.'
          }
        },
        {
          id: 'node_end_flow',
          type: 'end',
          title: 'Finish Conversation',
          x: 1640,
          y: 30,
          data: {
            message: 'Thank you for reaching out! A specialist will follow up shortly.'
          }
        }
      ],
      edges: [
        { id: 'e1', from: 'node_start', handle: 'next', to: 'node_welcome' },
        { id: 'e2', from: 'node_welcome', handle: 'next', to: 'node_menu' },
        { id: 'e3', from: 'node_menu', handle: 'option:0', to: 'node_products_info' },
        { id: 'e4', from: 'node_products_info', handle: 'next', to: 'node_crm_qualify' },
        { id: 'e5', from: 'node_crm_qualify', handle: 'next', to: 'node_end_flow' },
        { id: 'e6', from: 'node_menu', handle: 'option:1', to: 'node_pricing_info' },
        { id: 'e7', from: 'node_menu', handle: 'option:2', to: 'node_advisor_handoff' }
      ]
    },

    support: {
      name: 'Customer Support & FAQ',
      description: 'Answers common support inquiries, provides quick troubleshooting, and routes complex issues to agents.',
      trigger: {
        type: 'keyword',
        keywords: ['help', 'support', 'issue', 'problem', 'status'],
        match: 'contains',
        caseSensitive: false
      },
      enabled: true,
      nodes: [
        {
          id: 'n_start',
          type: 'start',
          title: 'Start Conversation',
          x: 60,
          y: 120,
          data: {}
        },
        {
          id: 'n_greet',
          type: 'text',
          title: 'Support Greeting',
          x: 340,
          y: 120,
          data: {
            text: 'Hello {{name}}! Welcome to OpenMsg Customer Support 🛡️\nHow can we help you resolve your issue today?',
            wait: false
          }
        },
        {
          id: 'n_faq_menu',
          type: 'buttons',
          title: 'Support Topics',
          x: 660,
          y: 120,
          data: {
            text: 'Please select the topic that best matches your query:',
            buttons: [
              { id: 'b_status', text: '🟢 Check System Status' },
              { id: 'b_qr', text: '📱 QR Code / Login Help' },
              { id: 'b_agent', text: '👨‍💻 Human Support Agent' }
            ],
            saveAs: 'support_topic'
          }
        },
        {
          id: 'n_status_info',
          type: 'text',
          title: 'System Operational',
          x: 1020,
          y: 40,
          data: {
            text: '✅ All OpenMsg engines, bulk dispatchers, and Chromium partitions are operating at 100% capacity with 0 disruptions.',
            wait: false
          }
        },
        {
          id: 'n_qr_info',
          type: 'text',
          title: 'QR Login Steps',
          x: 1020,
          y: 190,
          data: {
            text: '📲 *WhatsApp Linking Instructions:*\n\n1. Open WhatsApp on your phone\n2. Tap Linked Devices &gt; Link a Device\n3. Click "Accounts" in the left sidebar and scan the QR code\n4. Each profile is securely isolated in its own partition.',
            wait: false
          }
        },
        {
          id: 'n_agent_handoff',
          type: 'handoff',
          title: 'Escalate to Support Agent',
          x: 1020,
          y: 350,
          data: {
            customerMessage: 'We are transferring your ticket to an active support engineer. One moment please!'
          }
        }
      ],
      edges: [
        { id: 'e1', from: 'n_start', handle: 'next', to: 'n_greet' },
        { id: 'e2', from: 'n_greet', handle: 'next', to: 'n_faq_menu' },
        { id: 'e3', from: 'n_faq_menu', handle: 'option:0', to: 'n_status_info' },
        { id: 'e4', from: 'n_faq_menu', handle: 'option:1', to: 'n_qr_info' },
        { id: 'e5', from: 'n_faq_menu', handle: 'option:2', to: 'n_agent_handoff' }
      ]
    },

    booking: {
      name: 'Appointment & Demo Booking',
      description: 'Guides prospects through choosing a calendar slot, captures their email, and schedules a live product demo.',
      trigger: {
        type: 'keyword',
        keywords: ['book', 'booking', 'appointment', 'meeting', 'schedule', 'demo'],
        match: 'contains',
        caseSensitive: false
      },
      enabled: true,
      nodes: [
        {
          id: 'nb_start',
          type: 'start',
          title: 'Start Booking',
          x: 60,
          y: 120,
          data: {}
        },
        {
          id: 'nb_slot_choice',
          type: 'buttons',
          title: 'Select Preferred Slot',
          x: 340,
          y: 120,
          data: {
            text: '📅 Thanks for choosing to book a live demonstration with our technical specialists!\n\nWhich slot works best for you?',
            buttons: [
              { id: 's1', text: '🌅 Tomorrow Morning (11:00 AM)' },
              { id: 's2', text: '🌤️ Tomorrow Afternoon (3:00 PM)' },
              { id: 's3', text: '📆 This Friday (4:00 PM)' }
            ],
            saveAs: 'preferred_slot'
          }
        },
        {
          id: 'nb_capture_email',
          type: 'text',
          title: 'Capture Client Email',
          x: 700,
          y: 120,
          data: {
            text: 'Excellent! Slot reserved: *{{preferred_slot}}*.\n\nPlease type your business email address so we can email your calendar invite and video link:',
            wait: true,
            saveAs: 'client_email'
          }
        },
        {
          id: 'nb_crm_stage',
          type: 'action',
          title: 'Move to Proposal',
          x: 1020,
          y: 120,
          data: {
            action: 'move_stage',
            stage: 'proposal'
          }
        },
        {
          id: 'nb_confirmation',
          type: 'text',
          title: 'Booking Confirmation',
          x: 1320,
          y: 120,
          data: {
            text: '🎉 *Demo Successfully Scheduled!*\n\n• Slot: {{preferred_slot}}\n• Meeting Link sent to: {{client_email}}\n\nWe look forward to speaking with you!',
            wait: false
          }
        },
        {
          id: 'nb_end',
          type: 'end',
          title: 'Finish Flow',
          x: 1620,
          y: 120,
          data: {}
        }
      ],
      edges: [
        { id: 'eb1', from: 'nb_start', handle: 'next', to: 'nb_slot_choice' },
        { id: 'eb2', from: 'nb_slot_choice', handle: 'option:0', to: 'nb_capture_email' },
        { id: 'eb3', from: 'nb_slot_choice', handle: 'option:1', to: 'nb_capture_email' },
        { id: 'eb4', from: 'nb_slot_choice', handle: 'option:2', to: 'nb_capture_email' },
        { id: 'eb5', from: 'nb_capture_email', handle: 'next', to: 'nb_crm_stage' },
        { id: 'eb6', from: 'nb_crm_stage', handle: 'next', to: 'nb_confirmation' },
        { id: 'eb7', from: 'nb_confirmation', handle: 'next', to: 'nb_end' }
      ]
    }
  };

  // Node type metadata (icons, labels, colors)
  const NODE_META = {
    start:       { label: 'Start Flow',           icon: '🚀', color: '#ffc72c', bg: 'rgba(255,199,44,0.15)' },
    text:        { label: 'Send Text',            icon: '💬', color: '#7dd3fc', bg: 'rgba(125,211,252,0.15)' },
    buttons:     { label: 'Quick Buttons',        icon: '🔘', color: '#fde047', bg: 'rgba(253,224,71,0.15)' },
    list:        { label: 'Menu List',            icon: '📋', color: '#fdba74', bg: 'rgba(253,186,116,0.15)' },
    condition:   { label: 'Condition (If/Else)',  icon: '🔀', color: '#c4b5fd', bg: 'rgba(196,181,253,0.15)' },
    setVariable: { label: 'Set Variable',         icon: '🏷️', color: '#c4b5fd', bg: 'rgba(196,181,253,0.15)' },
    delay:       { label: 'Delay / Wait',         icon: '⏳', color: '#a7f3d0', bg: 'rgba(167,243,208,0.15)' },
    action:      { label: 'Kanban Stage',         icon: '📊', color: '#fed7aa', bg: 'rgba(254,215,170,0.15)' },
    webhook:     { label: 'Webhook API',          icon: '🌐', color: '#fed7aa', bg: 'rgba(254,215,170,0.15)' },
    handoff:     { label: 'Human Handoff',        icon: '👨‍💼', color: '#fca5a5', bg: 'rgba(252,165,165,0.15)' },
    end:         { label: 'End Conversation',     icon: '🏁', color: '#e2e8f0', bg: 'rgba(226,232,240,0.15)' }
  };

  // ─── Controller State ──────────────────────────────────────────────────
  let flowsList = [];
  let activeFlow = null;
  let selectedNodeId = null;
  let zoom = 1.0;

  // Dragging node state
  let dragNodeState = null;

  // Wire connection state
  let wireState = null;

  // Simulator state
  let simState = {
    currentNodeId: null,
    sessionVars: {},
    isWaitingReply: false
  };

  // DOM Elements cache
  let elFlowListView, elFlowEditorView, elFlowsGrid, elFlowsCountLabel;
  let elCanvasContainer, elCanvasSurface, elSvgLayer, elNodesLayer;
  let elInspector, elInspectorTitle, elInspectorType, elInspectorBody;
  let elTitleInput, elTriggerBadge, elTriggerSummary, elActiveToggle;
  let elTriggerModal, elSimulatorModal, elSimFeed, elSimVarsBar, elSimInput, elBtnSimSend;

  // ─── Initialization ────────────────────────────────────────────────────
  // ─── Initialization & Lifecycle ─────────────────────────────────────────
  function initFlowBuilder() {
    cacheDomElements();
    bindGlobalEvents();
    loadFlows();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initFlowBuilder);
  } else {
    initFlowBuilder();
  }

  // Expose global methods for direct access or inline triggers
  window.initFlowBuilder = initFlowBuilder;
  window.createNewFlow   = createNewFlow;
  window.useFlowTemplate = useTemplate;
  window.openFlowEditor  = openEditor;

  function cacheDomElements() {
    elFlowListView     = document.getElementById('flowListView');
    elFlowEditorView   = document.getElementById('flowEditorView');
    elFlowsGrid        = document.getElementById('flowsGrid');
    elFlowsCountLabel  = document.getElementById('flowsCountLabel');

    elCanvasContainer  = document.getElementById('flowCanvasContainer');
    elCanvasSurface    = document.getElementById('flowCanvasSurface');
    elSvgLayer         = document.getElementById('flowSvgLayer');
    elNodesLayer       = document.getElementById('flowNodesLayer');

    elInspector        = document.getElementById('flowInspector');
    elInspectorTitle   = document.getElementById('inspectorNodeTitle');
    elInspectorType    = document.getElementById('inspectorNodeType');
    elInspectorBody    = document.getElementById('inspectorBody');

    elTitleInput       = document.getElementById('flowEditorTitleInput');
    elTriggerBadge     = document.getElementById('btnEditTriggerBadge');
    elTriggerSummary   = document.getElementById('flowTriggerSummary');
    elActiveToggle     = document.getElementById('flowActiveToggle');

    elTriggerModal     = document.getElementById('flowTriggerModal');
    elSimulatorModal   = document.getElementById('flowSimulatorModal');
    elSimFeed          = document.getElementById('simulatorFeed');
    elSimVarsBar       = document.getElementById('simulatorVarsBar');
    elSimInput         = document.getElementById('simulatorInput');
    elBtnSimSend       = document.getElementById('btnSimulatorSend');
  }

  function bindGlobalEvents() {
    // 1. Delegated click handler on #flowListView for 100% reliable clicks
    if (elFlowListView) {
      elFlowListView.addEventListener('click', (e) => {
        // A. Template card or button inside it
        const tplCard = e.target.closest('.flow-template-card');
        if (tplCard) {
          e.preventDefault();
          e.stopPropagation();
          const tplKey = tplCard.getAttribute('data-template');
          if (tplKey && FLOW_TEMPLATES[tplKey]) {
            useTemplate(tplKey);
            return;
          }
        }

        // B. "+ Create New Flow" button
        const btnNew = e.target.closest('#btnCreateNewFlow');
        if (btnNew) {
          e.preventDefault();
          e.stopPropagation();
          createNewFlow();
          return;
        }

        // C. "Import Template" button
        const btnImport = e.target.closest('#btnImportFlowTemplate');
        if (btnImport) {
          e.preventDefault();
          e.stopPropagation();
          useTemplate('lead');
          return;
        }
      });
    }

    // Direct event listener on Create button as secondary safety
    const btnCreate = document.getElementById('btnCreateNewFlow');
    if (btnCreate) {
      btnCreate.addEventListener('click', (e) => {
        e.preventDefault();
        createNewFlow();
      });
    }

    // Direct event listener on Template cards & buttons
    document.querySelectorAll('.flow-template-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const tplKey = card.getAttribute('data-template');
        if (tplKey && FLOW_TEMPLATES[tplKey]) {
          useTemplate(tplKey);
        }
      });
    });

    const btnImportTemplate = document.getElementById('btnImportFlowTemplate');
    if (btnImportTemplate) {
      btnImportTemplate.addEventListener('click', (e) => {
        e.preventDefault();
        useTemplate('lead');
      });
    }

    // 3. Search Filter in List View
    const searchInput = document.getElementById('flowSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        renderFlowsGrid(q);
      });
    }

    // 4. Back to Flows Button
    const btnBack = document.getElementById('btnBackToFlows');
    if (btnBack) {
      btnBack.addEventListener('click', async () => {
        if (activeFlow) {
          await saveActiveFlow(true); // silent auto-save
        }
        closeEditor();
      });
    }

    // 5. Save Flow Button
    const btnSave = document.getElementById('btnSaveFlowGraph');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        await saveActiveFlow(false);
      });
    }

    // 6. Title and Active Switch
    if (elTitleInput) {
      elTitleInput.addEventListener('change', () => {
        if (activeFlow) activeFlow.name = elTitleInput.value.trim() || 'Untitled Flow';
      });
    }

    if (elActiveToggle) {
      elActiveToggle.addEventListener('change', () => {
        if (activeFlow) activeFlow.enabled = elActiveToggle.checked;
      });
    }

    // 7. Zoom Controls
    document.getElementById('btnZoomIn')?.addEventListener('click', () => setZoom(zoom + 0.15));
    document.getElementById('btnZoomOut')?.addEventListener('click', () => setZoom(zoom - 0.15));
    document.getElementById('btnZoomReset')?.addEventListener('click', () => setZoom(1.0));

    // 8. Palette Node Click -> Add to canvas
    document.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const nodeType = item.getAttribute('data-node-type');
        if (nodeType && activeFlow) {
          addNodeToFlow(nodeType);
        }
      });
    });

    // 9. Inspector Drawer Buttons
    document.getElementById('btnCloseInspector')?.addEventListener('click', closeInspector);
    document.getElementById('btnApplyInspector')?.addEventListener('click', applyInspectorChanges);
    document.getElementById('btnDeleteSelectedNode')?.addEventListener('click', deleteSelectedNode);

    // 10. Trigger Modal
    if (elTriggerBadge) {
      elTriggerBadge.addEventListener('click', openTriggerModal);
    }
    document.getElementById('btnCloseTriggerModal')?.addEventListener('click', closeTriggerModal);
    document.getElementById('btnCancelTriggerModal')?.addEventListener('click', closeTriggerModal);
    document.getElementById('btnSaveTriggerModal')?.addEventListener('click', saveTriggerModal);

    const modalTriggerType = document.getElementById('modalTriggerType');
    if (modalTriggerType) {
      modalTriggerType.addEventListener('change', (e) => {
        const kwWrap = document.getElementById('modalKeywordConfigWrap');
        if (kwWrap) {
          kwWrap.style.display = e.target.value === 'keyword' ? 'block' : 'none';
        }
      });
    }

    // 11. Simulator Modal
    document.getElementById('btnTestFlowSimulator')?.addEventListener('click', openSimulator);
    document.getElementById('btnCloseSimulatorModal')?.addEventListener('click', closeSimulator);
    document.getElementById('btnRestartSimulator')?.addEventListener('click', restartSimulator);

    if (elBtnSimSend && elSimInput) {
      elBtnSimSend.addEventListener('click', sendSimulatorMessage);
      elSimInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendSimulatorMessage();
        }
      });
    }

    // 12. Canvas Mouse Interaction (Dragging Nodes & Wire Connections)
    initCanvasInteractions();
  }

  // ─── Flows List Management ─────────────────────────────────────────────
  async function loadFlows() {
    try {
      flowsList = await window.api.getFlows();
      if (!Array.isArray(flowsList)) flowsList = [];
      renderFlowsGrid();
    } catch (e) {
      console.warn('[FlowBuilder] Failed to load flows:', e);
      flowsList = [];
    }
  }

  function renderFlowsGrid(filterQuery = '') {
    if (!elFlowsGrid) return;
    elFlowsGrid.innerHTML = '';

    const filtered = flowsList.filter(f => {
      if (!filterQuery) return true;
      const name = (f.name || '').toLowerCase();
      const desc = (f.description || '').toLowerCase();
      const kws = ((f.trigger?.keywords) || []).join(' ').toLowerCase();
      return name.includes(filterQuery) || desc.includes(filterQuery) || kws.includes(filterQuery);
    });

    const activeCount = flowsList.filter(f => f.enabled).length;
    if (elFlowsCountLabel) {
      elFlowsCountLabel.textContent = `${activeCount} Active / ${flowsList.length} Total Flows`;
    }

    if (filtered.length === 0) {
      elFlowsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🌱</div>
          <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">No Flows Found</div>
          <p style="font-size: 12px; margin-top: 4px;">Create your first flow or pick a pre-built template above to get started.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(flow => {
      const card = document.createElement('div');
      card.className = 'flow-card';

      // Format trigger summary
      let triggerLabel = '⚡ Keywords: ' + ((flow.trigger?.keywords || []).slice(0, 3).join(', ') || 'None');
      if (flow.trigger?.type === 'new_chat') triggerLabel = '✨ New Contact Intro';
      if (flow.trigger?.type === 'any_message') triggerLabel = '🌐 Universal Autoresponder';

      const nodesCount = (flow.nodes || []).length;
      const edgesCount = (flow.edges || []).length;

      card.innerHTML = `
        <div class="flow-card-top">
          <div class="flow-card-icon" style="background: rgba(255,199,44,0.12); color: #ffc72c; width: 34px; height: 34px; border-radius: 8px; display:flex; align-items:center; justify-content:center; font-size:16px;">
            🤖
          </div>
          <div style="flex:1; margin-left: 10px;">
            <div class="flow-card-title">${escapeHtml(flow.name || 'Untitled Flow')}</div>
            <div style="font-size: 11px; color: #ffc72c; margin-top: 2px;">${triggerLabel}</div>
          </div>
          <label style="display:flex; align-items:center; cursor:pointer;" title="Enable/Disable Flow">
            <input type="checkbox" class="toggle-flow-switch" data-id="${flow.id}" ${flow.enabled ? 'checked' : ''} style="width:16px; height:16px;">
          </label>
        </div>
        <div class="flow-card-desc">${escapeHtml(flow.description || 'Automated multi-step WhatsApp chatbot flow.')}</div>
        <div class="flow-card-meta">
          <span>📦 ${nodesCount} Nodes</span>
          <span>🔗 ${edgesCount} Connections</span>
          <span>🕒 ${new Date(flow.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
        <div class="flow-card-actions">
          <button type="button" class="btn btn-outline btn-xs btn-dup-flow" data-id="${flow.id}" title="Duplicate this flow">
            Duplicate
          </button>
          <button type="button" class="btn btn-outline btn-xs btn-del-flow" data-id="${flow.id}" style="color:#f87171;" title="Delete this flow">
            Delete
          </button>
          <button type="button" class="btn btn-primary btn-xs btn-edit-flow" data-id="${flow.id}">
            Open Studio &rarr;
          </button>
        </div>
      `;

      // Event listeners on card
      card.querySelector('.toggle-flow-switch')?.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        await window.api.toggleFlow(flow.id, enabled);
        flow.enabled = enabled;
        if (window.showToast) window.showToast(`Flow "${flow.name}" ${enabled ? 'Activated' : 'Paused'}`);
      });

      card.querySelector('.btn-edit-flow')?.addEventListener('click', () => {
        openEditor(flow);
      });

      card.querySelector('.btn-dup-flow')?.addEventListener('click', async () => {
        const res = await window.api.duplicateFlow(flow.id);
        if (res.success) {
          if (window.showToast) window.showToast('Flow duplicated successfully', 'success');
          await loadFlows();
        }
      });

      card.querySelector('.btn-del-flow')?.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete flow "${flow.name}"?`)) {
          await window.api.deleteFlow(flow.id);
          if (window.showToast) window.showToast('Flow deleted', 'info');
          await loadFlows();
        }
      });

      elFlowsGrid.appendChild(card);
    });
  }

  // ─── Flow Editor Lifecycle ─────────────────────────────────────────────
  function createNewFlow() {
    const blankFlow = {
      id: 'flow_' + Date.now(),
      name: 'New Custom Flow',
      description: 'Custom automated chatbot workflow',
      trigger: {
        type: 'keyword',
        keywords: ['hi', 'start'],
        match: 'contains',
        caseSensitive: false
      },
      enabled: true,
      createdAt: Date.now(),
      nodes: [
        {
          id: 'n_start',
          type: 'start',
          title: 'Start Conversation',
          x: 100,
          y: 140,
          data: {}
        },
        {
          id: 'n_text1',
          type: 'text',
          title: 'Greeting Message',
          x: 400,
          y: 140,
          data: {
            text: 'Hello {{name}}! Welcome to our WhatsApp service. How can we help you?',
            wait: false
          }
        }
      ],
      edges: [
        { id: 'e1', from: 'n_start', handle: 'next', to: 'n_text1' }
      ]
    };

    openEditor(blankFlow);
  }

  function useTemplate(tplKey) {
    const tpl = FLOW_TEMPLATES[tplKey];
    if (!tpl) return;

    // Deep clone
    const cloned = JSON.parse(JSON.stringify(tpl));
    cloned.id = 'flow_' + Date.now();
    cloned.name = cloned.name + ' (Copy)';
    cloned.createdAt = Date.now();

    openEditor(cloned);
    if (window.showToast) window.showToast(`Loaded "${tpl.name}" template into Studio!`, 'success');
  }

  function openEditor(flow) {
    activeFlow = JSON.parse(JSON.stringify(flow));
    selectedNodeId = null;

    if (elFlowListView) elFlowListView.style.display = 'none';
    if (elFlowEditorView) elFlowEditorView.style.display = 'flex';

    if (elTitleInput) elTitleInput.value = activeFlow.name || 'Untitled Flow';
    if (elActiveToggle) elActiveToggle.checked = Boolean(activeFlow.enabled);

    updateTriggerBadge();
    closeInspector();
    setZoom(1.0);

    renderGraph();

    // Center scroll on start node
    setTimeout(() => {
      const startNode = (activeFlow.nodes || []).find(n => n.type === 'start') || activeFlow.nodes[0];
      if (startNode && elCanvasContainer) {
        elCanvasContainer.scrollLeft = Math.max(0, startNode.x - 120);
        elCanvasContainer.scrollTop = Math.max(0, startNode.y - 80);
      }
    }, 50);
  }

  function closeEditor() {
    activeFlow = null;
    selectedNodeId = null;
    closeInspector();

    if (elFlowEditorView) elFlowEditorView.style.display = 'none';
    if (elFlowListView) elFlowListView.style.display = 'block';

    loadFlows();
  }

  async function saveActiveFlow(silent = false) {
    if (!activeFlow) return;

    // Update name and active status
    if (elTitleInput) activeFlow.name = elTitleInput.value.trim() || 'Untitled Flow';
    if (elActiveToggle) activeFlow.enabled = elActiveToggle.checked;

    try {
      const res = await window.api.saveFlow(activeFlow);
      if (res.success) {
        activeFlow = res.flow;
        if (!silent && window.showToast) {
          window.showToast('Flow graph saved successfully! 💾', 'success');
        }
      }
    } catch (e) {
      console.error('[FlowBuilder] Save failed:', e);
      if (!silent && window.showToast) {
        window.showToast('Failed to save flow: ' + e.message, 'error');
      }
    }
  }

  function updateTriggerBadge() {
    if (!elTriggerSummary || !activeFlow) return;
    const trig = activeFlow.trigger || {};
    if (trig.type === 'new_chat') {
      elTriggerSummary.textContent = '✨ New Contact Intro';
    } else if (trig.type === 'any_message') {
      elTriggerSummary.textContent = '🌐 Every Message';
    } else {
      const kws = (trig.keywords || []).slice(0, 3).join(', ');
      elTriggerSummary.textContent = 'Keywords: ' + (kws || 'None');
    }
  }

  function setZoom(newZoom) {
    zoom = Math.max(0.6, Math.min(1.6, Math.round(newZoom * 100) / 100));
    if (elCanvasSurface) {
      elCanvasSurface.style.transform = `scale(${zoom})`;
    }
    const zoomResetBtn = document.getElementById('btnZoomReset');
    if (zoomResetBtn) {
      zoomResetBtn.textContent = `${Math.round(zoom * 100)}%`;
    }
    renderEdges();
  }

  // ─── Visual Canvas Node & Edge Rendering ───────────────────────────────
  function renderGraph() {
    if (!activeFlow) return;
    renderNodes();
    renderEdges();
  }

  function renderNodes() {
    if (!elNodesLayer || !activeFlow) return;
    elNodesLayer.innerHTML = '';

    (activeFlow.nodes || []).forEach(node => {
      const meta = NODE_META[node.type] || { label: node.type, icon: '📦', color: '#ffc72c', bg: 'rgba(255,199,44,0.1)' };
      const el = document.createElement('div');
      el.className = 'flow-node' + (node.id === selectedNodeId ? ' selected' : '');
      el.setAttribute('data-id', node.id);
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;

      // Input Port (all except start)
      let inPortHtml = '';
      if (node.type !== 'start') {
        inPortHtml = `<div class="flow-node-port port-in" data-node-id="${node.id}" title="Input connection"></div>`;
      }

      // Default Output Port (for linear nodes)
      let outPortHtml = '';
      const hasBranches = ['buttons', 'list', 'condition'].includes(node.type);
      if (!hasBranches && node.type !== 'end' && node.type !== 'handoff') {
        outPortHtml = `<div class="flow-node-port port-out" data-node-id="${node.id}" data-handle="next" title="Next step"></div>`;
      }

      // Body preview markup
      let bodyHtml = getNodeBodyPreview(node);

      el.innerHTML = `
        ${inPortHtml}
        <div class="flow-node-header">
          <div style="display:flex; align-items:center; overflow:hidden;">
            <div class="flow-node-icon" style="background:${meta.bg}; color:${meta.color};">${meta.icon}</div>
            <div class="flow-node-title" title="${escapeHtml(node.title || meta.label)}">${escapeHtml(node.title || meta.label)}</div>
          </div>
        </div>
        <div class="flow-node-body">
          ${bodyHtml}
        </div>
        ${outPortHtml}
      `;

      // Click to select node
      el.addEventListener('mousedown', (e) => {
        // Prevent port clicks from triggering node drag
        if (e.target.classList.contains('flow-node-port') || e.target.classList.contains('flow-branch-port')) {
          return;
        }
        selectNode(node.id);
      });

      elNodesLayer.appendChild(el);
    });
  }

  function getNodeBodyPreview(node) {
    const data = node.data || {};
    switch (node.type) {
      case 'start':
        return `<div style="font-size:11px; color:var(--text-dim);">Workflow starts here when triggered.</div>`;

      case 'text': {
        const preview = truncate(data.text || 'Empty message...', 75);
        let waitBadge = data.wait ? `<span style="display:inline-block; font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(255,199,44,0.15); color:#ffc72c; margin-top:6px;">⏳ Waits for reply</span>` : '';
        return `<div>${escapeHtml(preview)}</div>${waitBadge}`;
      }

      case 'buttons': {
        const textPreview = truncate(data.text || 'Select an option:', 50);
        const buttons = data.buttons || [];
        let rows = buttons.map((b, idx) => `
          <div class="flow-branch-row">
            <span style="font-size:11px; color:var(--text-main); font-weight:600;">🔘 ${escapeHtml(b.text || `Button ${idx+1}`)}</span>
            <div class="flow-branch-port" data-node-id="${node.id}" data-handle="option:${idx}" title="Branch for ${escapeHtml(b.text)}"></div>
          </div>
        `).join('');

        return `
          <div style="margin-bottom:6px;">${escapeHtml(textPreview)}</div>
          <div style="border-top:1px solid rgba(255,255,255,0.06); margin-top:6px; padding-top:4px;">
            ${rows || '<div style="font-size:11px; color:var(--text-muted);">No buttons added yet</div>'}
          </div>
        `;
      }

      case 'list': {
        const rows = (data.sections?.[0]?.rows || data.items || []).map((r, idx) => `
          <div class="flow-branch-row">
            <span style="font-size:11px; color:var(--text-main);">📋 ${escapeHtml(r.title || `Item ${idx+1}`)}</span>
            <div class="flow-branch-port" data-node-id="${node.id}" data-handle="option:${idx}"></div>
          </div>
        `).join('');
        return `<div>${escapeHtml(data.text || 'Menu List')}</div>${rows}`;
      }

      case 'condition': {
        const varName = data.variable || 'variable';
        const op = data.operator || 'equals';
        const val = data.value || '';
        return `
          <div style="font-size:11px; margin-bottom:6px;">If <b>{{${escapeHtml(varName)}}}</b> ${escapeHtml(op)} "${escapeHtml(val)}"</div>
          <div class="flow-branch-row">
            <span style="font-size:11px; color:#34d399; font-weight:600;">✅ True / Match</span>
            <div class="flow-branch-port" data-node-id="${node.id}" data-handle="true"></div>
          </div>
          <div class="flow-branch-row">
            <span style="font-size:11px; color:#f87171; font-weight:600;">❌ False / Otherwise</span>
            <div class="flow-branch-port" data-node-id="${node.id}" data-handle="false"></div>
          </div>
        `;
      }

      case 'setVariable':
        return `<div style="font-size:11px;">Set <b>{{${escapeHtml(data.key || 'var')}}}</b> = "${escapeHtml(data.value || '')}"</div>`;

      case 'delay':
        return `<div style="font-size:11px;">⏳ Wait <b>${data.seconds || 3} seconds</b></div>`;

      case 'action':
        return `<div style="font-size:11px;">Move contact to CRM stage: <b style="color:#ffc72c; text-transform:uppercase;">${escapeHtml(data.stage || 'qualified')}</b></div>`;

      case 'webhook':
        return `<div style="font-size:11px; word-break:break-all;">🌐 <b>${escapeHtml(data.method || 'POST')}</b> ${escapeHtml(truncate(data.url || 'https://api...', 40))}</div>`;

      case 'handoff':
        return `<div style="font-size:11px; color:#fca5a5;">👨‍💼 Transfers conversation to live human agent.</div>`;

      case 'end':
        return `<div style="font-size:11px; color:var(--text-dim);">🏁 Ends flow session cleanly.</div>`;

      default:
        return `<div style="font-size:11px;">${escapeHtml(node.type)}</div>`;
    }
  }

  function renderEdges() {
    if (!elSvgLayer || !activeFlow) return;
    elSvgLayer.innerHTML = '';

    const edges = activeFlow.edges || [];
    edges.forEach(edge => {
      const fromPos = getPortPosition(edge.from, edge.handle, false);
      const toPos = getPortPosition(edge.to, null, true);

      if (!fromPos || !toPos) return;

      const pathData = computeBezierPath(fromPos.x, fromPos.y, toPos.x, toPos.y);

      // SVG Path
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathData);
      pathEl.setAttribute('class', 'flow-svg-line');
      pathEl.setAttribute('data-edge-id', edge.id);

      // Tooltip to delete
      pathEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this connection wire?')) {
          deleteEdge(edge.id);
        }
      });

      elSvgLayer.appendChild(pathEl);

      // Edge delete badge at midpoint
      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;

      const gBadge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gBadge.setAttribute('class', 'flow-edge-badge');
      gBadge.setAttribute('transform', `translate(${midX}, ${midY})`);
      gBadge.innerHTML = `
        <circle r="8" fill="#25262a" stroke="#ffc72c" stroke-width="1.5"></circle>
        <line x1="-3" y1="-3" x2="3" y2="3" stroke="#ffc72c" stroke-width="1.5"></line>
        <line x1="3" y1="-3" x2="-3" y2="3" stroke="#ffc72c" stroke-width="1.5"></line>
      `;

      gBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEdge(edge.id);
      });

      elSvgLayer.appendChild(gBadge);
    });
  }

  function getPortPosition(nodeId, handleKey, isInput = false) {
    if (!activeFlow) return null;
    const node = (activeFlow.nodes || []).find(n => n.id === nodeId);
    if (!node) return null;

    const nodeEl = document.querySelector(`.flow-node[data-id="${nodeId}"]`);
    if (nodeEl && elCanvasSurface) {
      let portEl;
      if (isInput) {
        portEl = nodeEl.querySelector('.port-in');
      } else if (handleKey && handleKey !== 'next') {
        portEl = nodeEl.querySelector(`.flow-branch-port[data-handle="${handleKey}"]`);
        if (!portEl) portEl = nodeEl.querySelector('.port-out');
      } else {
        portEl = nodeEl.querySelector('.port-out');
      }

      if (portEl) {
        const surfaceRect = elCanvasSurface.getBoundingClientRect();
        const portRect = portEl.getBoundingClientRect();
        if (surfaceRect.width > 0 && portRect.width > 0) {
          const x = (portRect.left + portRect.width / 2 - surfaceRect.left) / zoom;
          const y = (portRect.top + portRect.height / 2 - surfaceRect.top) / zoom;
          return { x, y };
        }
      }
    }

    // Reliable fallback calculation using node coordinates (width = 260px)
    const nodeWidth = 260;
    if (isInput) {
      return { x: node.x, y: node.y + 46 };
    }

    if (handleKey && handleKey.startsWith('option:')) {
      const idx = parseInt(handleKey.split(':')[1], 10) || 0;
      return { x: node.x + nodeWidth, y: node.y + 90 + (idx * 30) };
    }
    if (handleKey === 'true') {
      return { x: node.x + nodeWidth, y: node.y + 80 };
    }
    if (handleKey === 'false') {
      return { x: node.x + nodeWidth, y: node.y + 110 };
    }

    return { x: node.x + nodeWidth, y: node.y + 46 };
  }

  function computeBezierPath(x1, y1, x2, y2) {
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 45);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  function deleteEdge(edgeId) {
    if (!activeFlow || !activeFlow.edges) return;
    activeFlow.edges = activeFlow.edges.filter(e => e.id !== edgeId);
    renderEdges();
  }

  // ─── Canvas Mouse Dragging & Wiring Interactions ───────────────────────
  function initCanvasInteractions() {
    if (!elCanvasContainer || !elCanvasSurface) return;

    // Mouse Down on canvas surface
    elCanvasSurface.addEventListener('mousedown', (e) => {
      // 1. Port click -> start connecting wire
      const port = e.target.closest('.flow-node-port.port-out, .flow-branch-port');
      if (port) {
        e.stopPropagation();
        const fromNodeId = port.getAttribute('data-node-id');
        const handleKey = port.getAttribute('data-handle') || 'next';
        const startPos = getPortPosition(fromNodeId, handleKey, false);

        if (startPos) {
          wireState = {
            fromNodeId,
            handleKey,
            startX: startPos.x,
            startY: startPos.y
          };
        }
        return;
      }

      // 2. Node click -> start dragging node
      const nodeEl = e.target.closest('.flow-node');
      if (nodeEl) {
        const nodeId = nodeEl.getAttribute('data-id');
        const node = (activeFlow.nodes || []).find(n => n.id === nodeId);
        if (node) {
          dragNodeState = {
            nodeId,
            node,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            origNodeX: node.x,
            origNodeY: node.y
          };
        }
        return;
      }

      // 3. Canvas background click -> deselect node
      selectNode(null);
    });

    // Window Mouse Move (Smooth 60fps tracking)
    window.addEventListener('mousemove', (e) => {
      // 1. Dragging Node
      if (dragNodeState) {
        const dx = (e.clientX - dragNodeState.startMouseX) / zoom;
        const dy = (e.clientY - dragNodeState.startMouseY) / zoom;

        // Snap to 10px grid
        const newX = Math.max(10, Math.round((dragNodeState.origNodeX + dx) / 10) * 10);
        const newY = Math.max(10, Math.round((dragNodeState.origNodeY + dy) / 10) * 10);

        dragNodeState.node.x = newX;
        dragNodeState.node.y = newY;

        const nodeEl = document.querySelector(`.flow-node[data-id="${dragNodeState.nodeId}"]`);
        if (nodeEl) {
          nodeEl.style.left = `${newX}px`;
          nodeEl.style.top = `${newY}px`;
        }

        renderEdges();
        return;
      }

      // 2. Drawing temporary wire
      if (wireState) {
        const surfaceRect = elCanvasSurface.getBoundingClientRect();
        const currX = (e.clientX - surfaceRect.left) / zoom;
        const currY = (e.clientY - surfaceRect.top) / zoom;

        let tempPath = document.getElementById('tempWirePath');
        if (!tempPath) {
          tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          tempPath.setAttribute('id', 'tempWirePath');
          tempPath.setAttribute('class', 'flow-svg-line-temp');
          elSvgLayer.appendChild(tempPath);
        }

        const pathData = computeBezierPath(wireState.startX, wireState.startY, currX, currY);
        tempPath.setAttribute('d', pathData);
      }
    });

    // Window Mouse Up (Complete connection or stop drag)
    window.addEventListener('mouseup', (e) => {
      // Finish dragging node
      if (dragNodeState) {
        dragNodeState = null;
      }

      // Finish wire connection
      if (wireState) {
        const tempPath = document.getElementById('tempWirePath');
        if (tempPath) tempPath.remove();

        const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        const inPort = dropTarget?.closest('.flow-node-port.port-in');

        if (inPort) {
          const toNodeId = inPort.getAttribute('data-node-id');
          if (toNodeId && toNodeId !== wireState.fromNodeId) {
            addEdge(wireState.fromNodeId, wireState.handleKey, toNodeId);
          }
        }

        wireState = null;
      }
    });
  }

  function addEdge(fromNodeId, handleKey, toNodeId) {
    if (!activeFlow) return;
    if (!Array.isArray(activeFlow.edges)) activeFlow.edges = [];

    // Remove existing edge with exact same (from, handle)
    activeFlow.edges = activeFlow.edges.filter(e => !(e.from === fromNodeId && e.handle === handleKey));

    activeFlow.edges.push({
      id: 'e_' + Date.now(),
      from: fromNodeId,
      handle: handleKey || 'next',
      to: toNodeId
    });

    renderEdges();
  }

  // ─── Adding Nodes to Flow ──────────────────────────────────────────────
  function addNodeToFlow(nodeType) {
    if (!activeFlow) return;
    const meta = NODE_META[nodeType] || { label: nodeType };

    // Calculate position offset from viewport center or last node
    let targetX = 300;
    let targetY = 200;

    if (elCanvasContainer) {
      targetX = Math.round((elCanvasContainer.scrollLeft + 350) / 10) * 10;
      targetY = Math.round((elCanvasContainer.scrollTop + 180) / 10) * 10;
    }

    const newNodeId = 'node_' + Date.now();
    const defaultData = getDefaultNodeData(nodeType);

    const node = {
      id: newNodeId,
      type: nodeType,
      title: meta.label,
      x: targetX,
      y: targetY,
      data: defaultData
    };

    activeFlow.nodes.push(node);
    renderNodes();
    renderEdges();
    selectNode(newNodeId);

    if (window.showToast) window.showToast(`Added ${meta.label} node to canvas!`, 'info');
  }

  function getDefaultNodeData(nodeType) {
    switch (nodeType) {
      case 'text':
        return { text: 'Hello! How can we help you?', typingDelay: 1, wait: false };
      case 'buttons':
        return {
          text: 'Please select an option:',
          buttons: [
            { id: 'b1', text: 'Option 1' },
            { id: 'b2', text: 'Option 2' }
          ],
          saveAs: 'user_selection'
        };
      case 'list':
        return {
          text: 'Explore our catalog:',
          items: [
            { id: 'i1', title: 'Catalog Item 1' },
            { id: 'i2', title: 'Catalog Item 2' }
          ],
          saveAs: 'list_selection'
        };
      case 'condition':
        return { variable: 'user_selection', operator: 'equals', value: 'Option 1' };
      case 'setVariable':
        return { key: 'lead_status', value: 'interested' };
      case 'delay':
        return { seconds: 3 };
      case 'action':
        return { action: 'move_stage', stage: 'qualified' };
      case 'webhook':
        return { url: 'https://api.yourdomain.com/webhook', method: 'POST' };
      case 'handoff':
        return { customerMessage: 'Transferring you to a live support representative...' };
      case 'end':
        return { message: 'Thank you for chatting with us! Have a great day.' };
      default:
        return {};
    }
  }

  // ─── Node Inspector Drawer ─────────────────────────────────────────────
  function selectNode(nodeId) {
    selectedNodeId = nodeId;

    // Update DOM selection border
    document.querySelectorAll('.flow-node').forEach(el => {
      if (el.getAttribute('data-id') === nodeId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    if (!nodeId) {
      closeInspector();
      return;
    }

    const node = (activeFlow.nodes || []).find(n => n.id === nodeId);
    if (!node) {
      closeInspector();
      return;
    }

    openInspector(node);
  }

  function openInspector(node) {
    if (!elInspector || !elInspectorBody) return;
    elInspector.style.display = 'flex';

    const meta = NODE_META[node.type] || { label: node.type, icon: '📦' };
    if (elInspectorTitle) elInspectorTitle.textContent = node.title || meta.label;
    if (elInspectorType) elInspectorType.textContent = meta.label.toUpperCase();

    // Render inspector form based on type
    elInspectorBody.innerHTML = renderInspectorForm(node);
    bindInspectorFormEvents(node);
  }

  function closeInspector() {
    if (elInspector) elInspector.style.display = 'none';
  }

  function renderInspectorForm(node) {
    const data = node.data || {};
    let typeFields = '';

    const varChipsHtml = `
      <div style="margin-top:4px;">
        <span class="inspector-token-chip" data-token="{{name}}">{{name}}</span>
        <span class="inspector-token-chip" data-token="{{phone}}">{{phone}}</span>
        <span class="inspector-token-chip" data-token="{{time}}">{{time}}</span>
        <span class="inspector-token-chip" data-token="{Hi|Hello|Hey}">{Spintax}</span>
      </div>
    `;

    switch (node.type) {
      case 'start':
        typeFields = `
          <div style="padding:12px; background:rgba(255,199,44,0.08); border-radius:8px; font-size:12px; color:var(--text-muted);">
            🚀 This is the root node where the conversation begins when triggered.
          </div>
        `;
        break;

      case 'text':
        typeFields = `
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Message Text</label>
            <textarea id="inspectText" class="form-control" rows="5" placeholder="Enter message...">${escapeHtml(data.text || '')}</textarea>
            ${varChipsHtml}
          </div>
          <div class="form-group" style="margin-bottom:14px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px;">
              <input type="checkbox" id="inspectWait" ${data.wait ? 'checked' : ''} style="width:16px; height:16px;">
              <span style="font-weight:600; color:var(--text-main);">Wait for customer reply</span>
            </label>
            <span style="font-size:11px; color:var(--text-dim); display:block; margin-top:2px;">Pauses execution until the user types their answer.</span>
          </div>
          <div class="form-group" id="inspectSaveAsWrap" style="margin-bottom:14px; ${data.wait ? '' : 'display:none;'}">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Save reply to variable</label>
            <input type="text" id="inspectSaveAs" class="form-control" placeholder="e.g. user_need, email, query" value="${escapeHtml(data.saveAs || '')}">
          </div>
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Typing Simulation (Seconds)</label>
            <input type="number" id="inspectTyping" class="form-control" min="0" max="10" value="${data.typingDelay ?? 1}">
          </div>
        `;
        break;

      case 'buttons': {
        const buttons = data.buttons || [];
        const btnRows = buttons.map((b, idx) => `
          <div class="form-group" style="display:flex; gap:6px; margin-bottom:6px;">
            <input type="text" class="form-control inspect-btn-val" data-idx="${idx}" value="${escapeHtml(b.text || '')}" placeholder="Button ${idx+1}">
            <button type="button" class="btn btn-outline btn-xs inspect-del-btn" data-idx="${idx}" style="color:#f87171;">&times;</button>
          </div>
        `).join('');

        typeFields = `
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Header Message</label>
            <textarea id="inspectText" class="form-control" rows="3" placeholder="Select an option:">${escapeHtml(data.text || '')}</textarea>
            ${varChipsHtml}
          </div>
          <div class="form-group" style="margin-bottom:14px;">
            <div class="flex-between" style="margin-bottom:6px;">
              <label style="font-size:12px; font-weight:600;">Button Choices (${buttons.length}/5)</label>
              <button type="button" class="btn btn-outline btn-xs" id="btnAddButtonOption">+ Add Choice</button>
            </div>
            <div id="inspectButtonsList">
              ${btnRows || '<div style="font-size:11px; color:var(--text-dim);">No buttons yet</div>'}
            </div>
          </div>
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Save selected choice to variable</label>
            <input type="text" id="inspectSaveAs" class="form-control" placeholder="e.g. selected_option" value="${escapeHtml(data.saveAs || '')}">
          </div>
        `;
        break;
      }

      case 'condition':
        typeFields = `
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Variable Name to Evaluate</label>
            <input type="text" id="inspectCondVar" class="form-control" placeholder="e.g. selected_requirement or budget" value="${escapeHtml(data.variable || '')}">
          </div>
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Condition Operator</label>
            <select id="inspectCondOp" class="form-control">
              <option value="equals" ${data.operator === 'equals' ? 'selected' : ''}>Equals (==)</option>
              <option value="contains" ${data.operator === 'contains' ? 'selected' : ''}>Contains</option>
              <option value="startswith" ${data.operator === 'startswith' ? 'selected' : ''}>Starts With</option>
              <option value="gt" ${data.operator === 'gt' ? 'selected' : ''}>Greater Than (&gt;)</option>
              <option value="lt" ${data.operator === 'lt' ? 'selected' : ''}>Less Than (&lt;)</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Comparison Value</label>
            <input type="text" id="inspectCondVal" class="form-control" placeholder="Value to match" value="${escapeHtml(data.value || '')}">
          </div>
        `;
        break;

      case 'setVariable':
        typeFields = `
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Variable Key</label>
            <input type="text" id="inspectVarKey" class="form-control" placeholder="e.g. lead_score, interest" value="${escapeHtml(data.key || '')}">
          </div>
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Variable Value</label>
            <input type="text" id="inspectVarVal" class="form-control" placeholder="e.g. high, or {{selected_option}}" value="${escapeHtml(data.value || '')}">
          </div>
        `;
        break;

      case 'delay':
        typeFields = `
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Delay Duration (Seconds)</label>
            <input type="number" id="inspectDelaySec" class="form-control" min="1" max="300" value="${data.seconds || 3}">
            <span style="font-size:11px; color:var(--text-dim); display:block; margin-top:4px;">Execution pauses for this duration before the next node executes.</span>
          </div>
        `;
        break;

      case 'action':
        typeFields = `
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Move Contact to Kanban Stage</label>
            <select id="inspectStage" class="form-control">
              <option value="lead" ${data.stage === 'lead' ? 'selected' : ''}>New Lead</option>
              <option value="contacted" ${data.stage === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="qualified" ${data.stage === 'qualified' ? 'selected' : ''}>Qualified</option>
              <option value="proposal" ${data.stage === 'proposal' ? 'selected' : ''}>Proposal Sent</option>
              <option value="won" ${data.stage === 'won' ? 'selected' : ''}>Closed Won</option>
              <option value="lost" ${data.stage === 'lost' ? 'selected' : ''}>Lost</option>
            </select>
          </div>
        `;
        break;

      case 'webhook':
        typeFields = `
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Endpoint URL</label>
            <input type="url" id="inspectWebhookUrl" class="form-control" placeholder="https://api.yourcrm.com/leads" value="${escapeHtml(data.url || '')}">
          </div>
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">HTTP Method</label>
            <select id="inspectWebhookMethod" class="form-control">
              <option value="POST" ${data.method === 'POST' ? 'selected' : ''}>POST (JSON Payload)</option>
              <option value="GET" ${data.method === 'GET' ? 'selected' : ''}>GET</option>
            </select>
          </div>
        `;
        break;

      case 'handoff':
        typeFields = `
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Message to Customer</label>
            <textarea id="inspectHandoffCust" class="form-control" rows="3">${escapeHtml(data.customerMessage || 'Transferring you to a live support agent...')}</textarea>
          </div>
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Internal Notification Log</label>
            <input type="text" id="inspectHandoffAgent" class="form-control" value="${escapeHtml(data.agentMessage || 'Customer {{phone}} requested live assistance.')}">
          </div>
        `;
        break;

      case 'end':
        typeFields = `
          <div class="form-group">
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Optional Closing Message</label>
            <textarea id="inspectEndMsg" class="form-control" rows="3" placeholder="Leave empty or enter final message...">${escapeHtml(data.message || '')}</textarea>
          </div>
        `;
        break;
    }

    return `
      <div class="form-group" style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Node Title / Label</label>
        <input type="text" id="inspectNodeTitle" class="form-control" value="${escapeHtml(node.title || '')}">
      </div>
      ${typeFields}
    `;
  }

  function bindInspectorFormEvents(node) {
    // Variable chips token insertion into textarea
    document.querySelectorAll('.inspector-token-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const token = chip.getAttribute('data-token');
        const textarea = document.getElementById('inspectText');
        if (textarea && token) {
          const start = textarea.selectionStart || textarea.value.length;
          textarea.value = textarea.value.slice(0, start) + token + textarea.value.slice(start);
          textarea.focus();
        }
      });
    });

    // Wait toggle shows/hides saveAs input
    const waitChk = document.getElementById('inspectWait');
    const saveAsWrap = document.getElementById('inspectSaveAsWrap');
    if (waitChk && saveAsWrap) {
      waitChk.addEventListener('change', () => {
        saveAsWrap.style.display = waitChk.checked ? 'block' : 'none';
      });
    }

    // Button choices management
    const btnAddOption = document.getElementById('btnAddButtonOption');
    if (btnAddOption) {
      btnAddOption.addEventListener('click', () => {
        if (!node.data) node.data = {};
        if (!Array.isArray(node.data.buttons)) node.data.buttons = [];
        if (node.data.buttons.length >= 5) {
          alert('Maximum 5 buttons supported per message.');
          return;
        }
        node.data.buttons.push({
          id: 'b_' + Date.now(),
          text: `Choice ${node.data.buttons.length + 1}`
        });
        openInspector(node);
        renderNodes();
        renderEdges();
      });
    }

    document.querySelectorAll('.inspect-del-btn').forEach(delBtn => {
      delBtn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        if (node.data?.buttons && !isNaN(idx)) {
          node.data.buttons.splice(idx, 1);
          openInspector(node);
          renderNodes();
          renderEdges();
        }
      });
    });
  }

  function applyInspectorChanges() {
    if (!selectedNodeId || !activeFlow) return;
    const node = (activeFlow.nodes || []).find(n => n.id === selectedNodeId);
    if (!node) return;

    // Title
    const titleInp = document.getElementById('inspectNodeTitle');
    if (titleInp) node.title = titleInp.value.trim() || node.title;

    if (!node.data) node.data = {};

    switch (node.type) {
      case 'text': {
        const txt = document.getElementById('inspectText')?.value ?? '';
        const wait = document.getElementById('inspectWait')?.checked ?? false;
        const saveAs = document.getElementById('inspectSaveAs')?.value?.trim() ?? '';
        const typing = parseInt(document.getElementById('inspectTyping')?.value, 10) || 1;
        node.data.text = txt;
        node.data.wait = wait;
        node.data.saveAs = saveAs;
        node.data.typingDelay = typing;
        break;
      }

      case 'buttons': {
        const txt = document.getElementById('inspectText')?.value ?? '';
        const saveAs = document.getElementById('inspectSaveAs')?.value?.trim() ?? '';
        node.data.text = txt;
        node.data.saveAs = saveAs;

        document.querySelectorAll('.inspect-btn-val').forEach(input => {
          const idx = parseInt(input.getAttribute('data-idx'), 10);
          if (node.data.buttons?.[idx]) {
            node.data.buttons[idx].text = input.value.trim();
          }
        });
        break;
      }

      case 'condition': {
        node.data.variable = document.getElementById('inspectCondVar')?.value?.trim() ?? '';
        node.data.operator = document.getElementById('inspectCondOp')?.value ?? 'equals';
        node.data.value = document.getElementById('inspectCondVal')?.value?.trim() ?? '';
        break;
      }

      case 'setVariable': {
        node.data.key = document.getElementById('inspectVarKey')?.value?.trim() ?? '';
        node.data.value = document.getElementById('inspectVarVal')?.value?.trim() ?? '';
        break;
      }

      case 'delay': {
        node.data.seconds = parseInt(document.getElementById('inspectDelaySec')?.value, 10) || 3;
        break;
      }

      case 'action': {
        node.data.stage = document.getElementById('inspectStage')?.value ?? 'qualified';
        break;
      }

      case 'webhook': {
        node.data.url = document.getElementById('inspectWebhookUrl')?.value?.trim() ?? '';
        node.data.method = document.getElementById('inspectWebhookMethod')?.value ?? 'POST';
        break;
      }

      case 'handoff': {
        node.data.customerMessage = document.getElementById('inspectHandoffCust')?.value ?? '';
        node.data.agentMessage = document.getElementById('inspectHandoffAgent')?.value ?? '';
        break;
      }

      case 'end': {
        node.data.message = document.getElementById('inspectEndMsg')?.value ?? '';
        break;
      }
    }

    renderNodes();
    renderEdges();
    selectNode(node.id);

    if (window.showToast) window.showToast('Node properties updated!', 'info');
  }

  function deleteSelectedNode() {
    if (!selectedNodeId || !activeFlow) return;
    const node = (activeFlow.nodes || []).find(n => n.id === selectedNodeId);
    if (!node) return;

    if (node.type === 'start') {
      alert('Cannot delete the Start node of a flow.');
      return;
    }

    if (confirm(`Delete node "${node.title}"?`)) {
      // Remove node
      activeFlow.nodes = activeFlow.nodes.filter(n => n.id !== selectedNodeId);
      // Remove attached edges
      activeFlow.edges = (activeFlow.edges || []).filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId);

      selectedNodeId = null;
      closeInspector();
      renderNodes();
      renderEdges();
    }
  }

  // ─── Trigger Modal ─────────────────────────────────────────────────────
  function openTriggerModal() {
    if (!elTriggerModal || !activeFlow) return;
    const trig = activeFlow.trigger || {};

    const typeSelect = document.getElementById('modalTriggerType');
    const kwInput = document.getElementById('modalKeywordsInput');
    const matchSelect = document.getElementById('modalMatchMode');
    const kwWrap = document.getElementById('modalKeywordConfigWrap');

    if (typeSelect) typeSelect.value = trig.type || 'keyword';
    if (kwInput) kwInput.value = (trig.keywords || []).join(', ');
    if (matchSelect) matchSelect.value = trig.match || 'contains';

    if (kwWrap) {
      kwWrap.style.display = (trig.type === 'keyword' || !trig.type) ? 'block' : 'none';
    }

    elTriggerModal.style.display = 'flex';
  }

  function closeTriggerModal() {
    if (elTriggerModal) elTriggerModal.style.display = 'none';
  }

  function saveTriggerModal() {
    if (!activeFlow) return;
    const type = document.getElementById('modalTriggerType')?.value || 'keyword';
    const rawKws = document.getElementById('modalKeywordsInput')?.value || '';
    const match = document.getElementById('modalMatchMode')?.value || 'contains';

    const keywords = rawKws.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    activeFlow.trigger = {
      type,
      keywords,
      match,
      caseSensitive: false
    };

    updateTriggerBadge();
    closeTriggerModal();
    if (window.showToast) window.showToast('Flow trigger configuration updated!', 'success');
  }

  // ─── WhatsApp Sandbox Simulator ────────────────────────────────────────
  function openSimulator() {
    if (!elSimulatorModal || !activeFlow) return;
    elSimulatorModal.style.display = 'flex';
    restartSimulator();
  }

  function closeSimulator() {
    if (elSimulatorModal) elSimulatorModal.style.display = 'none';
  }

  async function restartSimulator() {
    if (!elSimFeed || !activeFlow) return;
    elSimFeed.innerHTML = '';

    simState = {
      currentNodeId: null,
      sessionVars: {
        name: 'Demo Client',
        phone: '919876543210'
      },
      isWaitingReply: false
    };

    updateSimulatorVars();

    // Find start node
    const startNode = (activeFlow.nodes || []).find(n => n.type === 'start') || activeFlow.nodes[0];
    if (!startNode) {
      appendSimulatorLog('Flow has no starting node.');
      return;
    }

    simState.currentNodeId = startNode.id;
    await advanceSimulator('');
  }

  async function advanceSimulator(userText = '') {
    if (!activeFlow || !simState.currentNodeId) return;

    try {
      const stepResult = await window.api.testFlowStep({
        flow: activeFlow,
        currentNodeId: simState.currentNodeId,
        incomingText: userText,
        variables: simState.sessionVars
      });

      if (stepResult.variables) {
        simState.sessionVars = { ...simState.sessionVars, ...stepResult.variables };
        updateSimulatorVars();
      }

      if (stepResult.replyText) {
        // Show typing indicator
        showSimTyping();
        await new Promise(r => setTimeout(r, 450));
        hideSimTyping();

        // Find node for interactive options
        const cNode = (activeFlow.nodes || []).find(n => n.id === simState.currentNodeId);
        appendBotMessage(stepResult.replyText, cNode);
      }

      simState.isWaitingReply = Boolean(stepResult.waitingForReply);
      simState.currentNodeId = stepResult.currentNodeId;

      // If finished
      if (stepResult.done || !stepResult.currentNodeId) {
        appendSimulatorLog('🏁 Flow conversation completed.');
      } else if (!stepResult.waitingForReply) {
        // Automatic advance for non-blocking nodes
        await new Promise(r => setTimeout(r, 300));
        await advanceSimulator('');
      }
    } catch (e) {
      console.warn('[Simulator] Step error:', e);
      appendSimulatorLog('Error in simulation: ' + e.message);
    }
  }

  async function sendSimulatorMessage() {
    if (!elSimInput) return;
    const text = elSimInput.value.trim();
    if (!text) return;

    elSimInput.value = '';
    appendUserMessage(text);

    await advanceSimulator(text);
  }

  function appendUserMessage(text) {
    if (!elSimFeed) return;
    const msg = document.createElement('div');
    msg.className = 'sim-bubble-user';
    msg.innerHTML = `
      <div>${escapeHtml(text)}</div>
      <div class="sim-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
    `;
    elSimFeed.appendChild(msg);
    elSimFeed.scrollTop = elSimFeed.scrollHeight;
  }

  function appendBotMessage(text, node) {
    if (!elSimFeed) return;
    const msg = document.createElement('div');
    msg.className = 'sim-bubble-bot';

    let interactiveHtml = '';
    if (node?.type === 'buttons' && Array.isArray(node.data?.buttons)) {
      const btnsHtml = node.data.buttons.map(b => `
        <div class="sim-quick-btn" data-choice="${escapeHtml(b.text)}">${escapeHtml(b.text)}</div>
      `).join('');
      interactiveHtml = `<div class="sim-quick-btns">${btnsHtml}</div>`;
    }

    msg.innerHTML = `
      <div style="white-space:pre-wrap;">${escapeHtml(text)}</div>
      ${interactiveHtml}
      <div class="sim-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;

    // Bind interactive quick buttons
    msg.querySelectorAll('.sim-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-choice');
        if (choice) {
          appendUserMessage(choice);
          advanceSimulator(choice);
        }
      });
    });

    elSimFeed.appendChild(msg);
    elSimFeed.scrollTop = elSimFeed.scrollHeight;
  }

  function showSimTyping() {
    if (!elSimFeed) return;
    let typing = document.getElementById('simTypingIndicator');
    if (!typing) {
      typing = document.createElement('div');
      typing.id = 'simTypingIndicator';
      typing.className = 'sim-typing-bubble';
      typing.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      `;
      elSimFeed.appendChild(typing);
      elSimFeed.scrollTop = elSimFeed.scrollHeight;
    }
  }

  function hideSimTyping() {
    const typing = document.getElementById('simTypingIndicator');
    if (typing) typing.remove();
  }

  function appendSimulatorLog(logText) {
    if (!elSimFeed) return;
    const log = document.createElement('div');
    log.style.textAlign = 'center';
    log.style.fontSize = '11px';
    log.style.color = 'var(--text-dim)';
    log.style.padding = '4px 0';
    log.textContent = logText;
    elSimFeed.appendChild(log);
    elSimFeed.scrollTop = elSimFeed.scrollHeight;
  }

  function updateSimulatorVars() {
    if (!elSimVarsBar) return;
    const entries = Object.entries(simState.sessionVars);
    if (entries.length === 0) {
      elSimVarsBar.innerHTML = '<span>Variables: None</span>';
      return;
    }

    elSimVarsBar.innerHTML = '<span>Variables:</span> ' + entries.map(([k, v]) => `
      <span class="sim-var-chip">${escapeHtml(k)}: <b>${escapeHtml(String(v))}</b></span>
    `).join(' ');
  }

  // ─── Utility Helpers ───────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function truncate(str, max = 50) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '...' : str;
  }

})();

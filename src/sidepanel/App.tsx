import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Users,
  Bot,
  Workflow,
  Zap,
  Send,
  Clock,
  FileText,
  Sparkles,
  BarChart3,
  Settings,
  Bell,
  Route,
  KanbanSquare,
  Image as ImageIcon,
  RefreshCw,
  X,
  Webhook,
} from 'lucide-react';
import { useUIStore } from '@/ui/store';
import { getWhatsAppClient } from '@/content/whatsapp';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsapp';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';
import { AutomationService } from '@/core/automation/automation-service';

// Feature components
import { DashboardOverview } from '@/features/dashboard/DashboardOverview';
import { ChatList } from '@/features/inbox/ChatList';
import { ConversationView } from '@/features/inbox/ConversationView';
import { MessageComposer } from '@/features/inbox/MessageComposer';
import { ContactSidebar } from '@/features/inbox/ContactSidebar';
import { ContactManager } from '@/features/crm/ContactManager';
import { ChatbotManager } from '@/features/chatbot/ChatbotManager';
import { WorkflowManager } from '@/features/workflows/WorkflowManager';
import { AutomationManager } from '@/features/automation/AutomationManager';
import { BroadcastManager } from '@/features/broadcasts/BroadcastManager';
import { SchedulerManager } from '@/features/scheduler/SchedulerManager';
import { TemplateManager } from '@/features/templates/TemplateManager';
import { MediaManager } from '@/features/media/MediaManager';
import { WebhookManager } from '@/features/webhooks/WebhookManager';
import { AIAssistantModal } from '@/features/ai/AIAssistantModal';
import { AnalyticsView } from '@/features/analytics/AnalyticsView';
import { SettingsView } from '@/features/settings/SettingsView';
import { DiagnosticsView } from '@/features/settings/DiagnosticsView';
import { GlobalSearchModal } from '@/features/search/GlobalSearchModal';
import { FollowUpManager } from '@/features/crm/followups/FollowUpManager';
import { SequenceManager } from '@/features/sequences/SequenceManager';
import { NotificationCenterModal } from '@/features/notifications/NotificationCenterModal';

import '@/ui/theme/openmsg-shell.css';

// ── Panel definitions ───────────────────────────────────────────────────────

type PanelId =
  | 'inbox'
  | 'contacts'
  | 'crm'
  | 'chatbot'
  | 'broadcasts'
  | 'sequences'
  | 'workflows'
  | 'automation'
  | 'templates'
  | 'media'
  | 'scheduler'
  | 'webhooks'
  | 'ai'
  | 'analytics'
  | 'followups'
  | 'settings'
  | 'diagnostics'
  | 'dashboard';

interface PanelDef {
  id: PanelId;
  label: string;
  icon: React.ReactNode;
  description: string;
  emoji: string;
}

const PANELS: PanelDef[] = [
  { id: 'inbox',      label: 'Send Message',   icon: <MessageSquare size={18}/>, description: 'Chat inbox & conversations', emoji: '💬' },
  { id: 'contacts',   label: 'Contacts',       icon: <Users size={18}/>,        description: 'Manage your CRM contacts',    emoji: '👤' },
  { id: 'templates',  label: 'Templates',      icon: <FileText size={18}/>,     description: 'Message templates library',   emoji: '📝' },
  { id: 'chatbot',    label: 'Chatbot',        icon: <Bot size={18}/>,          description: 'Automated reply bots',        emoji: '🤖' },
  { id: 'broadcasts', label: 'Broadcasts',     icon: <Send size={18}/>,         description: 'Send bulk messages',          emoji: '📢' },
  { id: 'sequences',  label: 'Sequences',      icon: <Route size={18}/>,        description: 'Follow-up sequences',         emoji: '🔁' },
  { id: 'scheduler',  label: 'Scheduler',      icon: <Clock size={18}/>,        description: 'Schedule messages',           emoji: '⏰' },
  { id: 'workflows',  label: 'Workflows',      icon: <Workflow size={18}/>,     description: 'Visual automation flows',     emoji: '⚙️' },
  { id: 'automation', label: 'Auto-Reply',     icon: <Zap size={18}/>,          description: 'Keyword automation rules',    emoji: '⚡' },
  { id: 'crm',        label: 'Kanban',         icon: <KanbanSquare size={18}/>, description: 'Deal pipeline & CRM board',   emoji: '📋' },
  { id: 'followups',  label: 'Follow-ups',     icon: <Bell size={18}/>,         description: 'Reminders & follow-up tasks', emoji: '🔔' },
  { id: 'media',      label: 'Media',          icon: <ImageIcon size={18}/>,    description: 'Media library & files',       emoji: '🖼️' },
  { id: 'webhooks',   label: 'Webhooks',       icon: <Webhook size={18}/>,      description: 'HTTP integrations & events',  emoji: '🔗' },
  { id: 'ai',         label: 'AI Assistant',   icon: <Sparkles size={18}/>,     description: 'AI-powered reply drafting',   emoji: '✨' },
];

// Panels shown as icon buttons in the top bar (first 14)
const TOPBAR_PANELS: PanelId[] = [
  'inbox', 'contacts', 'templates', 'chatbot', 'broadcasts',
  'sequences', 'scheduler', 'workflows', 'automation', 'crm',
  'followups', 'media', 'ai', 'webhooks',
];

// ── Filter pills for inbox ──────────────────────────────────────────────────

interface FilterPill {
  id: string;
  label: string;
}
const INBOX_FILTERS: FilterPill[] = [
  { id: 'all',      label: 'All Chats' },
  { id: 'unread',   label: 'Unread' },
  { id: 'groups',   label: 'Groups' },
  { id: 'starred',  label: 'Starred' },
  { id: 'archived', label: 'Archived' },
];

// ── Main App ────────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  const {
    isConnected,
    currentUser,
    setConnection,
    activeChat,
    setActiveChat,
  } = useUIStore();

  // Active panel state
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [inboxFilter, setInboxFilter] = useState<string>('all');

  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showContactSidebar, setShowContactSidebar] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Detect WhatsApp Web color scheme
  useEffect(() => {
    const detectTheme = () => {
      const body = document.body;
      if (body.classList.contains('dark') || body.getAttribute('data-color-mode') === 'dark') {
        setTheme('dark');
      } else {
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    };
    detectTheme();
    const obs = new MutationObserver(detectTheme);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-color-mode'] });
    return () => obs.disconnect();
  }, []);

  const client = getWhatsAppClient();

  // Load chat messages
  const loadChatMessages = async (chatId: string) => {
    try {
      const liveMsgs = await client.getMessages(chatId, { count: 50 });
      if (liveMsgs && liveMsgs.length > 0) {
        for (const m of liveMsgs) {
          await db.messages.put({
            id: m.id,
            chatId: m.chatId,
            sender: m.sender,
            fromMe: m.fromMe,
            body: m.body,
            type: m.type || 'chat',
            timestamp: m.timestamp,
            status: m.status || (m.ack === 3 ? 'read' : m.ack === 2 ? 'delivered' : m.ack === 1 ? 'sent' : 'pending'),
          });
        }
      }
    } catch (err) {
      console.warn('[OpenMsg] Fetching live messages failed:', err);
    }
    const localMsgs = await db.messages
      .where('chatId')
      .equals(chatId)
      .sortBy('timestamp');
    const mapped: WhatsAppMessage[] = localMsgs.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      sender: m.sender,
      fromMe: m.fromMe,
      body: m.body,
      type: (m.type as any) || 'chat',
      timestamp: m.timestamp,
      ack: m.status === 'read' ? 3 : m.status === 'delivered' ? 2 : m.status === 'sent' ? 1 : 0,
      status: m.status as any,
    }));
    setMessages(mapped);
  };

  const checkUnreadAlerts = async () => {
    try {
      const all = await db.followUps.toArray();
      const count = all.filter((fu) => {
        if (fu.status === 'COMPLETED' || fu.status === 'CANCELLED' || fu.reminderStatus === 'DISMISSED') return false;
        return fu.reminderStatus === 'TRIGGERED' || fu.dueAt < Date.now();
      }).length;
      setUnreadAlertsCount(count);
    } catch { /* ignore */ }
  };

  const syncWhatsAppWorkspaceData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const ready = await client.isReady();
      const user = await client.getCurrentUser();
      setConnection(ready, user);

      const c = await client.getChats();
      setChats(c);
      setIsLoadingChats(false);

      if (c.length > 0 && !activeChat) {
        setActiveChat(c[0]);
        loadChatMessages(c[0].id);
      }

      for (const chat of c) {
        await db.conversations.put({
          id: chat.id,
          contactId: chat.id,
          unreadCount: chat.unreadCount || 0,
          pinned: Boolean(chat.pinned),
          archived: Boolean(chat.archived),
          lastMessageText: chat.lastMessage?.body || chat.name || '',
          lastMessageTimestamp: chat.lastMessage?.timestamp || Date.now(),
        });
      }

      const cList = await client.getContacts();
      for (const contact of cList) {
        await ContactRepository.upsert({
          id: contact.id,
          phone: contact.phone,
          name: contact.name,
          isGroup: contact.isGroup,
        });
      }
    } catch (err) {
      console.warn('[OpenMsg] Data sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [client, activeChat, setConnection, setActiveChat]);

  useEffect(() => {
    syncWhatsAppWorkspaceData();

    const unsubConn = client.onConnectionChange((state) => {
      if (state === 'READY') {
        syncWhatsAppWorkspaceData();
      } else {
        client.isReady().then((ready) => {
          client.getCurrentUser().then((user) => setConnection(ready, user));
        });
      }
    });

    db.templates.toArray().then(setTemplates);

    const unsubMsg = client.onMessage(async (msg) => {
      await db.messages.put({
        id: msg.id, chatId: msg.chatId, sender: msg.sender, fromMe: msg.fromMe,
        body: msg.body, type: msg.type, timestamp: msg.timestamp,
        status: msg.status || (msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : msg.ack === 1 ? 'sent' : 'pending'),
      });
      await db.conversations.put({
        id: msg.chatId, contactId: msg.chatId, unreadCount: msg.fromMe ? 0 : 1,
        pinned: false, archived: false, lastMessageText: msg.body, lastMessageTimestamp: msg.timestamp,
      });
      if (!msg.fromMe) {
        await AutomationService.handleEvent({
          id: msg.id, trigger: 'MESSAGE_RECEIVED', contactId: msg.chatId, messageText: msg.body,
        }, client);
      }
      const updatedChats = await client.getChats();
      setChats(updatedChats);
      if (activeChat && activeChat.id === msg.chatId) {
        await loadChatMessages(msg.chatId);
      }
    });

    checkUnreadAlerts();
    const alertInterval = setInterval(checkUnreadAlerts, 20000);

    return () => {
      unsubMsg();
      unsubConn();
      clearInterval(alertInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncWhatsAppWorkspaceData]);

  useEffect(() => {
    if (activeChat) loadChatMessages(activeChat.id);
  }, [activeChat]);

  const handleSendText = async (text: string) => {
    if (!activeChat || isSending) return;
    setIsSending(true);
    try {
      await client.sendText({ chatId: activeChat.id, text });
      const newMsgId = `msg_${Date.now()}`;
      await db.messages.put({
        id: newMsgId, chatId: activeChat.id,
        sender: currentUser?.wid || currentUser?.phone || 'me',
        fromMe: true, body: text, type: 'chat', timestamp: Date.now(), status: 'sent',
      });
      await loadChatMessages(activeChat.id);
      const updatedChats = await client.getChats();
      setChats(updatedChats);
    } catch (err) {
      console.error('Failed to send text:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string) => {
    if (!activeChat || isSending) return;
    setIsSending(true);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      if (type === 'image') await client.sendImage({ chatId: activeChat.id, media: dataUrl, caption });
      else if (type === 'video') await client.sendVideo({ chatId: activeChat.id, media: dataUrl, caption });
      else if (type === 'audio') await client.sendAudio({ chatId: activeChat.id, media: dataUrl });
      else await client.sendDocument({ chatId: activeChat.id, media: dataUrl, filename: file.name, mimetype: file.type });
      await loadChatMessages(activeChat.id);
    } catch (err) {
      console.error('Failed to send media:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle a panel open/close
  const togglePanel = (id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  };

  // Get filtered chats
  const filteredChats = chats.filter((c) => {
    if (inboxFilter === 'unread') return (c.unreadCount || 0) > 0;
    if (inboxFilter === 'groups') return c.isGroup;
    if (inboxFilter === 'archived') return c.archived;
    return true;
  });

  const panelDef = PANELS.find((p) => p.id === activePanel);

  return (
    <div
      className="om-root"
      data-theme={theme}
    >
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header className="om-topbar">
        {/* Brand */}
        <div className="om-brand">
          <img
            src={chrome.runtime.getURL('icons/icon-48.png')}
            alt="OpenMsg"
            className="om-brand-logo"
          />
          <span className="om-brand-name">OpenMsg</span>
        </div>

        {/* Filter pills — shown when Inbox is active, else show app name tagline */}
        <div className="om-filter-pills">
          {activePanel === 'inbox' ? (
            INBOX_FILTERS.map((f) => (
              <button
                key={f.id}
                className={`om-filter-pill${inboxFilter === f.id ? ' is-active' : ''}`}
                onClick={() => setInboxFilter(f.id)}
                type="button"
              >
                {f.label}
                {f.id === 'unread' && chats.filter((c) => (c.unreadCount || 0) > 0).length > 0 && (
                  <span className="om-filter-pill-count">
                    {chats.filter((c) => (c.unreadCount || 0) > 0).length}
                  </span>
                )}
              </button>
            ))
          ) : (
            <span style={{ color: 'var(--bar-muted)', fontSize: '12px', paddingLeft: '4px' }}>
              WhatsApp CRM &amp; Automation
            </span>
          )}
        </div>

        {/* Tool Buttons */}
        <div className="om-actions">
          {TOPBAR_PANELS.map((pid) => {
            const p = PANELS.find((x) => x.id === pid)!;
            return (
              <button
                key={pid}
                className={`om-topbtn${activePanel === pid ? ' is-active' : ''}`}
                data-tip={p.label}
                onClick={() => togglePanel(pid)}
                type="button"
                title={p.label}
              >
                {p.icon}
              </button>
            );
          })}

          <span className="om-vsep" />

          {/* Notifications */}
          <button
            className={`om-topbtn${showNotificationCenter ? ' is-active' : ''}`}
            data-tip="Notifications"
            onClick={() => setShowNotificationCenter(true)}
            type="button"
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadAlertsCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--danger)', border: '1.5px solid var(--bar-bg)',
              }} />
            )}
          </button>

          {/* Analytics */}
          <button
            className={`om-topbtn${activePanel === 'analytics' ? ' is-active' : ''}`}
            data-tip="Analytics"
            onClick={() => togglePanel('analytics')}
            type="button"
          >
            <BarChart3 size={18} />
          </button>

          {/* Settings */}
          <button
            className={`om-topbtn${activePanel === 'settings' ? ' is-active' : ''}`}
            data-tip="Settings"
            onClick={() => togglePanel('settings')}
            type="button"
          >
            <Settings size={18} />
          </button>

          <span className="om-vsep" />

          {/* Sync */}
          <button
            className="om-topbtn"
            data-tip={isSyncing ? 'Syncing...' : 'Sync WhatsApp'}
            onClick={() => syncWhatsAppWorkspaceData()}
            disabled={isSyncing}
            type="button"
            title="Sync WhatsApp"
          >
            <RefreshCw size={17} className={isSyncing ? 'animate-spin' : ''} style={isSyncing ? { animation: 'om-spin 1s linear infinite' } : {}} />
          </button>

          {/* Connection status */}
          <span className={`om-status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="om-status-dot" />
            {isConnected
              ? (currentUser?.name || currentUser?.phone || 'Connected')
              : 'Connecting...'}
          </span>

          {/* Minimize */}
          <button
            className="om-topbtn"
            data-tip="Minimize OpenMsg"
            onClick={() => window.postMessage({ type: 'OPENMSG_CLOSE_UI' }, '*')}
            type="button"
            title="Minimize"
            style={{ color: 'var(--bar-muted)' }}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ── PANEL ───────────────────────────────────────────── */}
      {activePanel && panelDef && activePanel !== 'inbox' && (
        <div className="om-panel" key={activePanel}>
          {/* Panel Header */}
          <div className="om-panel-head">
            <div className="om-panel-icon" aria-hidden="true">
              {panelDef.icon}
            </div>
            <div className="om-panel-heading">
              <h2 className="om-panel-title">{panelDef.label}</h2>
              <p className="om-panel-sub">{panelDef.description}</p>
            </div>
            <div className="om-panel-actions">
              <button
                className="om-close-btn"
                onClick={() => setActivePanel(null)}
                title="Close panel"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="om-panel-body">
            <PanelContent
              panelId={activePanel}
              onSendText={handleSendText}
              onOpenPanel={(id) => setActivePanel(id as PanelId)}
            />
          </div>
        </div>
      )}

      {/* ── INBOX PANEL (special full-height layout) ─────────── */}
      {activePanel === 'inbox' && (
        <div className="om-inbox-panel" key="inbox">
          <div className="om-panel-head">
            <div className="om-panel-icon" aria-hidden="true">
              <MessageSquare size={18} />
            </div>
            <div className="om-panel-heading">
              <h2 className="om-panel-title">Messages</h2>
              <p className="om-panel-sub">
                {isLoadingChats ? 'Loading chats...' : `${filteredChats.length} conversations`}
              </p>
            </div>
            <div className="om-panel-actions">
              <button
                className="om-close-btn"
                onClick={() => setActivePanel(null)}
                title="Close"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Inbox Body: split chat list + conversation */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Chat List */}
            <div style={{ width: 220, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
              <ChatList
                chats={filteredChats}
                activeChat={activeChat}
                onSelectChat={(c) => setActiveChat(c)}
                isLoading={isLoadingChats}
              />
            </div>

            {/* Conversation */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {activeChat ? (
                <>
                  <ConversationView
                    chat={activeChat}
                    messages={messages}
                    showSidebar={showContactSidebar}
                    onToggleSidebar={() => setShowContactSidebar(!showContactSidebar)}
                  />
                  <MessageComposer
                    onSendText={handleSendText}
                    onSendMedia={handleSendMedia}
                    templates={templates}
                    recentMessages={messages.map((m) => m.body)}
                    isSending={isSending}
                  />
                </>
              ) : (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--muted)', gap: 8, fontSize: 13,
                }}>
                  <MessageSquare size={32} style={{ opacity: 0.35 }} />
                  <span>Select a conversation</span>
                </div>
              )}
            </div>

            {/* Contact sidebar */}
            {showContactSidebar && activeChat && (
              <div style={{ width: 260, borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>
                <ContactSidebar
                  contactId={activeChat.id}
                  onClose={() => setShowContactSidebar(false)}
                  onStartWorkflow={() => setActivePanel('workflows')}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────── */}
      <GlobalSearchModal />
      <NotificationCenterModal
        isOpen={showNotificationCenter}
        onClose={() => {
          setShowNotificationCenter(false);
          checkUnreadAlerts();
        }}
      />
    </div>
  );

};

// ── Panel Content Router ────────────────────────────────────────────────────

interface PanelContentProps {
  panelId: PanelId;
  onSendText: (text: string) => void;
  onOpenPanel: (id: string) => void;
}

const PanelContent: React.FC<PanelContentProps> = ({
  panelId,
  onSendText,
  onOpenPanel,
}) => {
  switch (panelId) {
    case 'dashboard':
      return <DashboardOverview />;
    case 'contacts':
      return <ContactManager initialViewMode="table" />;
    case 'crm':
      return <ContactManager initialViewMode="kanban" />;
    case 'followups':
      return <FollowUpManager />;
    case 'sequences':
      return <SequenceManager />;
    case 'chatbot':
      return <ChatbotManager />;
    case 'workflows':
      return <WorkflowManager />;
    case 'automation':
      return <AutomationManager />;
    case 'broadcasts':
      return <BroadcastManager />;
    case 'scheduler':
      return <SchedulerManager />;
    case 'templates':
      return <TemplateManager />;
    case 'media':
      return <MediaManager />;
    case 'webhooks':
      return <WebhookManager />;
    case 'ai':
      return (
        <AIAssistantModal
          isOpen={true}
          onClose={() => onOpenPanel('inbox')}
          onInsertText={(text) => onSendText(text)}
        />
      );
    case 'analytics':
      return <AnalyticsView />;
    case 'settings':
      return <SettingsView />;
    case 'diagnostics':
      return <DiagnosticsView />;
    default:
      return (
        <div className="om-empty">
          <div className="om-empty-icon">🚀</div>
          <div className="om-empty-title">Coming Soon</div>
          <div className="om-muted">This panel is under development.</div>
        </div>
      );
  }
};

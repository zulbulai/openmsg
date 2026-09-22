import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Workflow,
  Zap,
  Send,
  Clock,
  FileText,
  Globe,
  Sparkles,
  BarChart3,
  Settings,
  Bell,
  Route,
  KanbanSquare,
  Image as ImageIcon,
  Activity,
} from 'lucide-react';
import { useUIStore } from '@/ui/store';
import { getWhatsAppClient } from '@/content/whatsapp';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsapp';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';
import { AutomationService } from '@/core/automation/automation-service';

// Subsystem Components
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

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isConnected,
    currentUser,
    setConnection,
    activeChat,
    setActiveChat,
  } = useUIStore();

  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showContactSidebar, setShowContactSidebar] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [uiMode, setUiMode] = useState<'FULL' | 'SPLIT'>('FULL');

  const checkUnreadAlerts = async () => {
    try {
      const all = await db.followUps.toArray();
      const count = all.filter((fu) => {
        if (fu.status === 'COMPLETED' || fu.status === 'CANCELLED' || fu.reminderStatus === 'DISMISSED') {
          return false;
        }
        const isTriggered = fu.reminderStatus === 'TRIGGERED';
        const isOverdue = fu.dueAt < Date.now();
        return isTriggered || isOverdue;
      }).length;
      setUnreadAlertsCount(count);
    } catch {
      // Ignore
    }
  };

  const client = getWhatsAppClient();

  // Load chat messages from IndexedDB and client
  const loadChatMessages = async (chatId: string) => {
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

  useEffect(() => {
    // 1. Check connection
    client.isReady().then((ready) => {
      client.getCurrentUser().then((user) => {
        setConnection(ready, user);
      });
    });

    // 2. Fetch and sync chats & contacts
    client.getChats().then((c) => {
      setChats(c);
      setIsLoadingChats(false);
      if (c.length > 0 && !activeChat) {
        setActiveChat(c[0]);
        loadChatMessages(c[0].id);
      }
    });

    client.getContacts().then((cList) => {
      cList.forEach((c) => {
        ContactRepository.upsert({
          id: c.id,
          phone: c.phone,
          name: c.name,
          isGroup: c.isGroup,
        });
      });
    });

    // 3. Load quick templates
    db.templates.toArray().then(setTemplates);

    // 4. Listen for live incoming & outgoing messages
    const unsubMsg = client.onMessage(async (msg) => {
      // Save to IndexedDB
      await db.messages.put({
        id: msg.id,
        chatId: msg.chatId,
        sender: msg.sender,
        fromMe: msg.fromMe,
        body: msg.body,
        type: msg.type,
        timestamp: msg.timestamp,
        status: msg.status || (msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : msg.ack === 1 ? 'sent' : 'pending'),
      });

      // Update conversation
      await db.conversations.put({
        id: msg.chatId,
        contactId: msg.chatId,
        unreadCount: msg.fromMe ? 0 : 1,
        pinned: false,
        archived: false,
        lastMessageText: msg.body,
        lastMessageTimestamp: msg.timestamp,
      });

      // Run automations on incoming messages
      if (!msg.fromMe) {
        await AutomationService.handleEvent(
          {
            id: msg.id,
            trigger: 'MESSAGE_RECEIVED',
            contactId: msg.chatId,
            messageText: msg.body,
          },
          client
        );
      }

      // Update UI state
      const updatedChats = await client.getChats();
      setChats(updatedChats);

      if (activeChat && activeChat.id === msg.chatId) {
        await loadChatMessages(msg.chatId);
      }
    });

    // 5. Initial check & poll for unread reminders
    checkUnreadAlerts();
    const alertInterval = setInterval(checkUnreadAlerts, 20000);

    return () => {
      unsubMsg();
      clearInterval(alertInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadChatMessages(activeChat.id);
    }
  }, [activeChat]);

  // Handle outgoing text send
  const handleSendText = async (text: string) => {
    if (!activeChat || isSending) return;
    setIsSending(true);
    try {
      await client.sendText({
        chatId: activeChat.id,
        text,
      });

      // Save to local DB immediately
      const newMsgId = `msg_${Date.now()}`;
      await db.messages.put({
        id: newMsgId,
        chatId: activeChat.id,
        sender: currentUser?.wid || currentUser?.phone || 'me',
        fromMe: true,
        body: text,
        type: 'chat',
        timestamp: Date.now(),
        status: 'sent',
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

  // Handle outgoing media send
  const handleSendMedia = async (
    file: File,
    type: 'image' | 'video' | 'audio' | 'document',
    caption?: string
  ) => {
    if (!activeChat || isSending) return;
    setIsSending(true);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      if (type === 'image') {
        await client.sendImage({ chatId: activeChat.id, media: dataUrl, caption });
      } else if (type === 'video') {
        await client.sendVideo({ chatId: activeChat.id, media: dataUrl, caption });
      } else if (type === 'audio') {
        await client.sendAudio({ chatId: activeChat.id, media: dataUrl });
      } else {
        await client.sendDocument({
          chatId: activeChat.id,
          media: dataUrl,
          filename: file.name,
          mimetype: file.type,
        });
      }

      await loadChatMessages(activeChat.id);
    } catch (err) {
      console.error('Failed to send media:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`openmsg-app text-zinc-100 flex flex-col h-[100dvh] w-full overflow-hidden bg-[#0a0a0a] font-sans antialiased`}>
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/80 px-4 flex items-center justify-between backdrop-blur shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src="/icons/icon-48.png"
            alt="OpenMsg Logo"
            className="h-8 w-8 rounded-lg object-contain shadow-sm border border-zinc-800/80 bg-zinc-900"
          />
          <div>
            <h1 className="text-xs font-bold leading-tight flex items-center gap-1.5">
              OpenMsg
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-400">
                v0.1.0
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400">WhatsApp Automation &amp; CRM</p>
          </div>
        </div>

        {/* Real WhatsApp Connection Badge & Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newMode = uiMode === 'FULL' ? 'SPLIT' : 'FULL';
              setUiMode(newMode);
              window.postMessage({ type: 'OPENMSG_SET_MODE', payload: { mode: newMode } }, '*');
            }}
            title={uiMode === 'FULL' ? 'Switch to Split View' : 'Switch to Full Screen Workspace'}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition border border-zinc-700/60 text-xs font-semibold"
          >
            {uiMode === 'FULL' ? 'Split View' : 'Full Screen'}
          </button>
          <button
            onClick={() => {
              window.postMessage({ type: 'OPENMSG_CLOSE_UI' }, '*');
            }}
            title="Minimize OpenMsg"
            className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition border border-red-900/30 text-xs font-semibold"
          >
            Minimize
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotificationCenter(true)}
            title="Notification Center"
            className="relative p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition border border-zinc-700/60"
          >
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isConnected ? currentUser?.name || currentUser?.phone || 'Connected' : 'Connecting...'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        {/* Navigation Sidebar */}
        <nav className="w-16 border-r border-zinc-800 bg-zinc-900/40 flex flex-col items-center py-3 gap-1.5 shrink-0 overflow-y-auto">
          <NavButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Overview"
          />
          <NavButton
            active={activeTab === 'inbox'}
            onClick={() => setActiveTab('inbox')}
            icon={<MessageSquare className="h-4 w-4" />}
            label="Inbox"
          />
          <NavButton
            active={activeTab === 'contacts'}
            onClick={() => setActiveTab('contacts')}
            icon={<Users className="h-4 w-4" />}
            label="Contacts"
          />
          <NavButton
            active={activeTab === 'crm'}
            onClick={() => setActiveTab('crm')}
            icon={<KanbanSquare className="h-4 w-4" />}
            label="CRM"
          />
          <NavButton
            active={activeTab === 'kanban'}
            onClick={() => setActiveTab('kanban')}
            icon={<KanbanSquare className="h-4 w-4" />}
            label="Kanban"
          />
          <NavButton
            active={activeTab === 'followups'}
            onClick={() => setActiveTab('followups')}
            icon={<Bell className="h-4 w-4" />}
            label="Follow-ups"
          />
          <NavButton
            active={activeTab === 'sequences'}
            onClick={() => setActiveTab('sequences')}
            icon={<Route className="h-4 w-4" />}
            label="Sequences"
          />
          <NavButton
            active={activeTab === 'workflows'}
            onClick={() => setActiveTab('workflows')}
            icon={<Workflow className="h-4 w-4" />}
            label="Flows"
          />
          <NavButton
            active={activeTab === 'automation'}
            onClick={() => setActiveTab('automation')}
            icon={<Zap className="h-4 w-4" />}
            label="Rules"
          />
          <NavButton
            active={activeTab === 'broadcasts'}
            onClick={() => setActiveTab('broadcasts')}
            icon={<Send className="h-4 w-4" />}
            label="Broadcast"
          />
          <NavButton
            active={activeTab === 'templates'}
            onClick={() => setActiveTab('templates')}
            icon={<FileText className="h-4 w-4" />}
            label="Templates"
          />
          <NavButton
            active={activeTab === 'media'}
            onClick={() => setActiveTab('media')}
            icon={<ImageIcon className="h-4 w-4" />}
            label="Media"
          />
          <NavButton
            active={activeTab === 'scheduler'}
            onClick={() => setActiveTab('scheduler')}
            icon={<Clock className="h-4 w-4" />}
            label="Scheduler"
          />
          <NavButton
            active={activeTab === 'chatbot'}
            onClick={() => setActiveTab('chatbot')}
            icon={<Bot className="h-4 w-4" />}
            label="Chatbot"
          />
          <NavButton
            active={activeTab === 'webhooks'}
            onClick={() => setActiveTab('webhooks')}
            icon={<Globe className="h-4 w-4" />}
            label="Webhooks"
          />
          <NavButton
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            icon={<Sparkles className="h-4 w-4" />}
            label="AI"
          />
          <NavButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Analytics"
          />
          <NavButton
            active={activeTab === 'diagnostics'}
            onClick={() => setActiveTab('diagnostics')}
            icon={<Activity className="h-4 w-4" />}
            label="Diagnostics"
          />

          <div className="mt-auto pt-2 border-t border-zinc-800/80 w-full flex justify-center">
            <NavButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="h-4 w-4" />}
              label="Settings"
            />
          </div>
        </nav>

        {/* Dynamic Main Workspace Tab */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'dashboard' && <DashboardOverview />}

          {activeTab === 'inbox' && (
            <div className="flex-1 flex h-full overflow-hidden">
              {/* Chat Thread List */}
              <ChatList
                chats={chats}
                activeChat={activeChat}
                onSelectChat={(c) => setActiveChat(c)}
                isLoading={isLoadingChats}
              />

              {/* Chat Conversation View & Composer */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
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
                  <div className="flex-1 flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                    <MessageSquare className="h-8 w-8 text-zinc-700" />
                    Select a conversation to start chatting.
                  </div>
                )}
              </div>

              {/* Contact Sidebar Details Drawer */}
              {showContactSidebar && activeChat && (
                <ContactSidebar
                  contactId={activeChat.id}
                  onClose={() => setShowContactSidebar(false)}
                  onStartWorkflow={() => {
                    setActiveTab('workflows');
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'contacts' && <ContactManager initialViewMode="table" />}
          {activeTab === 'crm' && <ContactManager initialViewMode="kanban" />}
          {activeTab === 'kanban' && <ContactManager initialViewMode="kanban" />}
          {activeTab === 'followups' && <FollowUpManager />}
          {activeTab === 'sequences' && <SequenceManager />}
          {activeTab === 'chatbot' && <ChatbotManager />}
          {activeTab === 'workflows' && <WorkflowManager />}
          {activeTab === 'automation' && <AutomationManager />}
          {activeTab === 'broadcasts' && <BroadcastManager />}
          {activeTab === 'scheduler' && <SchedulerManager />}
          {activeTab === 'templates' && <TemplateManager />}
          {activeTab === 'media' && <MediaManager />}
          {activeTab === 'webhooks' && <WebhookManager />}
          {activeTab === 'ai' && (
            <AIAssistantModal
              isOpen={true}
              onClose={() => setActiveTab('dashboard')}
              onInsertText={(text) => handleSendText(text)}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'diagnostics' && (
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
              <DiagnosticsView />
            </div>
          )}
        </main>

        <GlobalSearchModal />
        <NotificationCenterModal
          isOpen={showNotificationCenter}
          onClose={() => {
            setShowNotificationCenter(false);
            checkUnreadAlerts();
          }}
        />
      </div>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
      active
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/40'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
    }`}
  >
    {icon}
    <span className="text-[9px] font-medium leading-none">{label}</span>
  </button>
);

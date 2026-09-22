import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Users,
  Workflow,
  Clock,
  Send,
  Bot,
  Activity,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { db } from '@/storage/db';
import { useUIStore } from '@/ui/store';

interface DashboardStats {
  totalContacts: number;
  unreadChats: number;
  todaySent: number;
  todayReceived: number;
  activeWorkflows: number;
  pendingSchedules: number;
  totalCampaigns: number;
}

interface ActivityItem {
  id: string;
  type: 'message' | 'workflow' | 'schedule' | 'audit';
  title: string;
  subtitle: string;
  timestamp: number;
}

export const DashboardOverview: React.FC = () => {
  const { setActiveTab, isConnected, currentUser, setGlobalSearchOpen } = useUIStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    unreadChats: 0,
    todaySent: 0,
    todayReceived: 0,
    activeWorkflows: 0,
    pendingSchedules: 0,
    totalCampaigns: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayMs = startOfToday.getTime();

      // Parallel queries across Dexie stores
      const [
        totalContacts,
        conversations,
        todayMessages,
        activeWorkflows,
        pendingSchedules,
        totalCampaigns,
        auditLogs,
      ] = await Promise.all([
        db.contacts.count(),
        db.conversations.toArray(),
        db.messages.where('timestamp').aboveOrEqual(todayMs).toArray(),
        db.workflows.where('isActive').equals(1).count(),
        db.scheduledMessages.where('status').equals('pending').count(),
        db.broadcastCampaigns.count(),
        db.auditLogs.reverse().limit(10).toArray(),
      ]);

      const unreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      const todaySent = todayMessages.filter((m) => m.fromMe).length;
      const todayReceived = todayMessages.filter((m) => !m.fromMe).length;

      setStats({
        totalContacts,
        unreadChats: unreadCount,
        todaySent,
        todayReceived,
        activeWorkflows,
        pendingSchedules,
        totalCampaigns,
      });

      // Build recent activity feed
      const activity: ActivityItem[] = [];

      // Add audit items
      auditLogs.forEach((log) => {
        activity.push({
          id: log.id,
          type: 'audit',
          title: log.eventType.replace(/_/g, ' '),
          subtitle: String(log.details?.summary || log.actor || 'System event'),
          timestamp: log.timestamp,
        });
      });

      // Add recent message items
      const recentMsgs = await db.messages.reverse().limit(8).toArray();
      recentMsgs.forEach((msg) => {
        activity.push({
          id: msg.id,
          type: 'message',
          title: msg.fromMe ? 'Outgoing Message' : 'Incoming Message',
          subtitle: msg.body.length > 40 ? `${msg.body.slice(0, 40)}...` : msg.body,
          timestamp: msg.timestamp,
        });
      });

      activity.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activity.slice(0, 8));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 p-6 space-y-6">
      {/* Welcome & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''} 👋
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            OpenMsg is actively monitoring your WhatsApp Web workspace and automation flows.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="px-3.5 py-1.5 text-xs bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 transition flex items-center gap-2"
          >
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-900 text-zinc-400 rounded border border-zinc-700">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => loadDashboardData()}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg border border-zinc-700/60 transition"
            title="Refresh metrics"
          >
            <Activity className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Unread Chats */}
        <div
          onClick={() => setActiveTab('inbox')}
          className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 hover:border-emerald-500/30 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Unread Chats</span>
            <MessageSquare className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-100">{stats.unreadChats}</div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <span>Click to view inbox</span>
          </div>
        </div>

        {/* Contacts */}
        <div
          onClick={() => setActiveTab('crm')}
          className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 hover:border-blue-500/30 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Contacts</span>
            <Users className="h-4 w-4 text-blue-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-100">{stats.totalContacts}</div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <span>Manage CRM contacts</span>
          </div>
        </div>

        {/* Today's Sent */}
        <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Sent Today</span>
            <Send className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-100">{stats.todaySent}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Outbound dispatched</span>
          </div>
        </div>

        {/* Today's Received */}
        <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Received Today</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-100">{stats.todayReceived}</div>
          <div className="text-[10px] text-purple-400/80 mt-1 flex items-center gap-1">
            <span>Inbound captured</span>
          </div>
        </div>

        {/* Active Workflows */}
        <div
          onClick={() => setActiveTab('workflows')}
          className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 hover:border-amber-500/30 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Active Flows</span>
            <Workflow className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-100">{stats.activeWorkflows}</div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <span>Workflow automations</span>
          </div>
        </div>

        {/* Pending Scheduled */}
        <div
          onClick={() => setActiveTab('scheduler')}
          className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70 hover:border-cyan-500/30 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Scheduled</span>
            <Clock className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-100">{stats.pendingSchedules}</div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <span>Queued time triggers</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <button
            onClick={() => setActiveTab('inbox')}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 text-xs font-medium text-zinc-200 transition text-left"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span>Open Inbox</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800/50 text-xs font-medium text-zinc-200 transition text-left"
          >
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="h-4 w-4" />
            </div>
            <span>Add Contact</span>
          </button>

          <button
            onClick={() => setActiveTab('chatbot')}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/50 text-xs font-medium text-zinc-200 transition text-left"
          >
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Bot className="h-4 w-4" />
            </div>
            <span>Chatbot Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/50 text-xs font-medium text-zinc-200 transition text-left"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Workflow className="h-4 w-4" />
            </div>
            <span>Design Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcasts')}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 hover:bg-zinc-800/50 text-xs font-medium text-zinc-200 transition text-left"
          >
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
              <Send className="h-4 w-4" />
            </div>
            <span>New Broadcast</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-800/50 text-xs font-medium text-zinc-200 transition text-left"
          >
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="h-4 w-4" />
            </div>
            <span>Schedule Task</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Activity & Connection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Recent Workspace Activity</h2>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500">
              Loading recent events...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <Activity className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">No recent events recorded in local database.</p>
              <p className="text-[11px] text-zinc-600">Events will appear as messages and flows run.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50 overflow-y-auto">
              {recentActivity.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.type === 'message'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : item.type === 'workflow'
                            ? 'bg-amber-500/10 text-amber-400'
                            : item.type === 'schedule'
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.type === 'message' && <MessageSquare className="h-3.5 w-3.5" />}
                      {item.type === 'workflow' && <Workflow className="h-3.5 w-3.5" />}
                      {item.type === 'schedule' && <Clock className="h-3.5 w-3.5" />}
                      {item.type === 'audit' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{item.title}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integration Status & Health */}
        <div className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Integration Health</h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-zinc-300">WhatsApp Web</span>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    isConnected ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isConnected ? 'ONLINE' : 'CONNECTING'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Dexie IndexedDB</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">READY</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Rate Limiter</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Alarm Manager</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">RUNNING</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('settings')}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 rounded-xl text-xs text-zinc-300 font-medium transition"
              >
                View Diagnostics &amp; Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

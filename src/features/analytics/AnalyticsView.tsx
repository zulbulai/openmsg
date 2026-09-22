import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Workflow,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { db } from '@/storage/db';

interface AnalyticsData {
  totalContacts: number;
  totalConversations: number;
  totalSent: number;
  totalReceived: number;
  unreadConversations: number;
  activeWorkflows: number;
  completedExecutions: number;
  failedExecutions: number;
  campaignTotal: number;
  campaignSent: number;
  campaignFailed: number;
  scheduledPending: number;
  dailyBuckets: Array<{ date: string; sent: number; received: number }>;
}

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      const now = Date.now();
      const rangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoffTime = now - rangeDays * 24 * 60 * 60 * 1000;

      const [
        contactsCount,
        conversations,
        messages,
        workflows,
        executions,
        campaigns,
        schedules,
      ] = await Promise.all([
        db.contacts.count(),
        db.conversations.toArray(),
        db.messages.toArray(),
        db.workflows.toArray(),
        db.workflowExecutions.toArray(),
        db.broadcastCampaigns.toArray(),
        db.scheduledMessages.toArray(),
      ]);

      const filteredMessages =
        timeRange === 'all'
          ? messages
          : messages.filter((m) => m.timestamp >= cutoffTime);

      const totalSent = filteredMessages.filter((m) => m.fromMe).length;
      const totalReceived = filteredMessages.filter((m) => !m.fromMe).length;
      const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

      const activeWorkflows = workflows.filter((w) => w.isActive).length;
      const completedExecutions = executions.filter((e) => e.status === 'COMPLETED').length;
      const failedExecutions = executions.filter((e) => e.status === 'FAILED').length;

      const campaignTotal = campaigns.reduce((sum, c) => sum + (c.totalRecipients || 0), 0);
      const campaignSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
      const campaignFailed = campaigns.reduce((sum, c) => sum + (c.failedCount || 0), 0);

      const scheduledPending = schedules.filter((s) => s.status.toLowerCase() === 'pending').length;

      // Group messages by day for the SVG bar chart
      const bucketsMap = new Map<string, { sent: number; received: number }>();
      const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        bucketsMap.set(key, { sent: 0, received: 0 });
      }

      filteredMessages.forEach((msg) => {
        const key = new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (bucketsMap.has(key)) {
          const b = bucketsMap.get(key)!;
          if (msg.fromMe) b.sent++;
          else b.received++;
        }
      });

      const dailyBuckets = Array.from(bucketsMap.entries()).map(([date, counts]) => ({
        date,
        sent: counts.sent,
        received: counts.received,
      }));

      setData({
        totalContacts: contactsCount,
        totalConversations: conversations.length,
        totalSent,
        totalReceived,
        unreadConversations: unreadCount,
        activeWorkflows,
        completedExecutions,
        failedExecutions,
        campaignTotal,
        campaignSent,
        campaignFailed,
        scheduledPending,
        dailyBuckets,
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const maxDailyVolume = Math.max(
    1,
    ...(data?.dailyBuckets.map((b) => Math.max(b.sent, b.received)) || [1])
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            Workspace Analytics &amp; Reports
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time local metrics derived directly from IndexedDB without external telemetry.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
          {(['7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                timeRange === r
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-zinc-500">Calculating analytics metrics...</div>
      ) : !data || (data.totalSent === 0 && data.totalReceived === 0 && data.totalContacts === 0) ? (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-16 text-center space-y-3">
          <BarChart3 className="h-12 w-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No data available</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Analytics will populate in real-time as customer chats arrive, campaigns send, and workflows run.
          </p>
        </div>
      ) : (
        <>
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-medium text-zinc-400">Total Contacts</span>
              <div className="text-2xl font-extrabold text-zinc-100 mt-1">{data.totalContacts}</div>
              <span className="text-[10px] text-zinc-500">In CRM database</span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-medium text-zinc-400">Conversations</span>
              <div className="text-2xl font-extrabold text-zinc-100 mt-1">{data.totalConversations}</div>
              <span className="text-[10px] text-emerald-400">{data.unreadConversations} unread</span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-medium text-zinc-400">Messages Sent</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{data.totalSent}</div>
              <span className="text-[10px] text-zinc-500">Outbound dispatched</span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-medium text-zinc-400">Messages Received</span>
              <div className="text-2xl font-extrabold text-purple-400 mt-1">{data.totalReceived}</div>
              <span className="text-[10px] text-zinc-500">Inbound captured</span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-medium text-zinc-400">Flow Runs</span>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">
                {data.completedExecutions + data.failedExecutions}
              </div>
              <span className="text-[10px] text-zinc-500">
                {data.completedExecutions} ok • {data.failedExecutions} err
              </span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-medium text-zinc-400">Scheduled Queue</span>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1">{data.scheduledPending}</div>
              <span className="text-[10px] text-zinc-500">Pending triggers</span>
            </div>
          </div>

          {/* Daily Message Volume SVG Bar Chart */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Daily Message Volume</h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                  <span>Sent</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-purple-400" />
                  <span>Received</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="h-44 w-full flex items-end gap-2 pt-4 px-2">
              {data.dailyBuckets.map((b, idx) => {
                const sentH = Math.max(4, Math.round((b.sent / maxDailyVolume) * 120));
                const recvH = Math.max(4, Math.round((b.received / maxDailyVolume) * 120));

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      <div
                        style={{ height: `${b.sent > 0 ? sentH : 2}px` }}
                        className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-sm transition relative"
                        title={`Sent: ${b.sent}`}
                      />
                      <div
                        style={{ height: `${b.received > 0 ? recvH : 2}px` }}
                        className="w-1/2 bg-purple-500/80 hover:bg-purple-400 rounded-t-sm transition relative"
                        title={`Received: ${b.received}`}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-500 truncate max-w-full text-center">
                      {b.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Stats Grid: Workflow Engine & Broadcast Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workflow Execution Performance */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-amber-400" />
                  <span>Workflow Execution Breakdown</span>
                </h2>
                <span className="text-xs text-zinc-400">
                  {data.activeWorkflows} active flows
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Completed Successfully</span>
                    </span>
                    <span className="font-semibold text-emerald-400">{data.completedExecutions}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${
                          data.completedExecutions + data.failedExecutions > 0
                            ? (data.completedExecutions /
                                (data.completedExecutions + data.failedExecutions)) *
                              100
                            : 0
                        }%`,
                      }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      <span>Failed / Errored</span>
                    </span>
                    <span className="font-semibold text-red-400">{data.failedExecutions}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${
                          data.completedExecutions + data.failedExecutions > 0
                            ? (data.failedExecutions /
                                (data.completedExecutions + data.failedExecutions)) *
                              100
                            : 0
                        }%`,
                      }}
                      className="h-full bg-red-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Broadcast Delivery Performance */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Send className="h-4 w-4 text-pink-400" />
                  <span>Broadcast Campaign Delivery</span>
                </h2>
                <span className="text-xs text-zinc-400">
                  {data.campaignTotal} targeted
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-300">
                    <span>Delivered Successfully</span>
                    <span className="font-semibold text-pink-400">
                      {data.campaignSent} / {data.campaignTotal || 1}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${
                          data.campaignTotal > 0
                            ? (data.campaignSent / data.campaignTotal) * 100
                            : 0
                        }%`,
                      }}
                      className="h-full bg-pink-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-zinc-400 text-xs">
                  <span>Failed Deliveries:</span>
                  <span className="text-red-400 font-medium">{data.campaignFailed}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

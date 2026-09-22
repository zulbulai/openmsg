import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Tag as TagIcon,
  FileEdit,
  Play,
  CheckCircle,
  Clock,
  GitCommit,
} from 'lucide-react';
import { db } from '@/storage/db';

interface TimelineEvent {
  id: string;
  type:
    | 'MESSAGE_SENT'
    | 'MESSAGE_RECEIVED'
    | 'TAG_ADDED'
    | 'NOTE_ADDED'
    | 'WORKFLOW_STARTED'
    | 'WORKFLOW_COMPLETED'
    | 'STAGE_CHANGED';
  title: string;
  description?: string;
  timestamp: number;
}

interface ContactTimelineProps {
  contactId: string;
}

export const ContactTimeline: React.FC<ContactTimelineProps> = ({ contactId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      const items: TimelineEvent[] = [];

      // 0. Stage Movement History
      const stagesHistory = await db.stageHistory.where('contactId').equals(contactId).toArray();
      const pipelines = await db.pipelines.toArray();
      const stageNameMap = new Map<string, string>();
      pipelines.forEach((p) => p.stages.forEach((s) => stageNameMap.set(s.id, s.name)));

      stagesHistory.forEach((sh) => {
        const fromName = sh.fromStageId ? stageNameMap.get(sh.fromStageId) || sh.fromStageId : 'Initial';
        const toName = stageNameMap.get(sh.toStageId) || sh.toStageId;
        items.push({
          id: `sh_${sh.id}`,
          type: 'STAGE_CHANGED',
          title: `Stage Changed: ${fromName} → ${toName}`,
          description: `Moved via ${sh.source.toLowerCase()}`,
          timestamp: sh.changedAt,
        });
      });

      // 1. Messages
      const msgs = await db.messages.where('chatId').equals(contactId).limit(30).toArray();
      msgs.forEach((m) => {
        items.push({
          id: `msg_${m.id}`,
          type: m.fromMe ? 'MESSAGE_SENT' : 'MESSAGE_RECEIVED',
          title: m.fromMe ? 'Message Sent' : 'Message Received',
          description: m.body,
          timestamp: m.timestamp,
        });
      });

      // 2. Notes
      const notes = await db.notes.where('contactId').equals(contactId).toArray();
      notes.forEach((n) => {
        items.push({
          id: `note_${n.id}`,
          type: 'NOTE_ADDED',
          title: 'CRM Note Added',
          description: n.content,
          timestamp: n.createdAt,
        });
      });

      // 3. Workflow Executions
      const execs = await db.workflowExecutions.where('contactId').equals(contactId).toArray();
      execs.forEach((e) => {
        items.push({
          id: `wf_start_${e.id}`,
          type: 'WORKFLOW_STARTED',
          title: 'Workflow Execution Started',
          description: `Workflow ID: ${e.workflowId}`,
          timestamp: e.startedAt,
        });

        if (e.status === 'COMPLETED' && e.completedAt) {
          items.push({
            id: `wf_done_${e.id}`,
            type: 'WORKFLOW_COMPLETED',
            title: 'Workflow Execution Completed',
            description: `Workflow ID: ${e.workflowId}`,
            timestamp: e.completedAt,
          });
        }
      });

      // Sort chronological descending
      items.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(items);
      setLoading(false);
    };

    fetchTimeline();
  }, [contactId]);

  const renderIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'STAGE_CHANGED':
        return <GitCommit className="h-3.5 w-3.5 text-cyan-400" />;
      case 'MESSAGE_SENT':
        return <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />;
      case 'MESSAGE_RECEIVED':
        return <MessageSquare className="h-3.5 w-3.5 text-sky-400" />;
      case 'TAG_ADDED':
        return <TagIcon className="h-3.5 w-3.5 text-amber-400" />;
      case 'NOTE_ADDED':
        return <FileEdit className="h-3.5 w-3.5 text-indigo-400" />;
      case 'WORKFLOW_STARTED':
        return <Play className="h-3.5 w-3.5 text-violet-400" />;
      case 'WORKFLOW_COMPLETED':
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-zinc-400" />;
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-xs text-zinc-500">Loading timeline...</div>;
  }

  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <h4 className="font-bold text-zinc-200">Activity Timeline</h4>
      {events.length === 0 ? (
        <div className="text-zinc-500 text-center py-6">No recorded activity yet.</div>
      ) : (
        <div className="relative border-l border-zinc-800 ml-2 pl-4 flex flex-col gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="relative flex flex-col gap-0.5">
              {/* Dot */}
              <div className="absolute -left-[23px] top-0.5 h-5 w-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                {renderIcon(ev.type)}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">{ev.title}</span>
                <span className="text-[10px] text-zinc-500">
                  {new Date(ev.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {ev.description && (
                <p className="text-[11px] text-zinc-400 whitespace-pre-wrap mt-0.5">
                  {ev.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

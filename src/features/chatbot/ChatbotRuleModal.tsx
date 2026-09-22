import React, { useState } from 'react';
import { X, Bot, Tag, Workflow } from 'lucide-react';
import { AutomationRule } from '@/storage/schemas';
import { db } from '@/storage/db';

interface ChatbotRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialRule?: AutomationRule | null;
}

export const ChatbotRuleModal: React.FC<ChatbotRuleModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialRule,
}) => {
  const [name, setName] = useState(initialRule?.name || '');
  const [matchType, setMatchType] = useState<string>(
    initialRule?.conditions?.[0]?.operator || 'contains'
  );
  const [keyword, setKeyword] = useState<string>(
    (initialRule?.conditions?.[0]?.value as string) || ''
  );
  const [replyText, setReplyText] = useState<string>(
    (initialRule?.actions?.find((a) => a.type === 'SEND_MESSAGE')?.config?.text as string) || ''
  );
  const [tagToAdd, setTagToAdd] = useState<string>(
    (initialRule?.actions?.find((a) => a.type === 'ADD_TAG')?.config?.tag as string) || ''
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    (initialRule?.actions?.find((a) => a.type === 'START_WORKFLOW')?.config?.workflowId as string) || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    if (isOpen) {
      setName(initialRule?.name || '');
      setMatchType(initialRule?.conditions?.[0]?.operator || 'contains');
      setKeyword((initialRule?.conditions?.[0]?.value as string) || '');
      setReplyText(
        (initialRule?.actions?.find((a) => a.type === 'SEND_MESSAGE')?.config?.text as string) || ''
      );
      setTagToAdd(
        (initialRule?.actions?.find((a) => a.type === 'ADD_TAG')?.config?.tag as string) || ''
      );
      setSelectedWorkflowId(
        (initialRule?.actions?.find((a) => a.type === 'START_WORKFLOW')?.config?.workflowId as string) || ''
      );

      db.workflows.toArray().then((wf) => {
        setWorkflows(wf.map((w) => ({ id: w.id, name: w.name })));
      });
    }
  }, [isOpen, initialRule]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !keyword.trim()) return;

    setIsSubmitting(true);
    try {
      const actions: Array<{ type: string; config: Record<string, unknown> }> = [];

      if (replyText.trim()) {
        actions.push({
          type: 'SEND_MESSAGE',
          config: { text: replyText.trim() },
        });
      }

      if (tagToAdd.trim()) {
        actions.push({
          type: 'ADD_TAG',
          config: { tag: tagToAdd.trim() },
        });
      }

      if (selectedWorkflowId) {
        actions.push({
          type: 'START_WORKFLOW',
          config: { workflowId: selectedWorkflowId },
        });
      }

      const rule: AutomationRule = {
        id: initialRule?.id || `bot_${Date.now()}`,
        name: name.trim(),
        enabled: initialRule?.enabled ?? true,
        trigger: 'MESSAGE_RECEIVED',
        conditions: [
          {
            field: 'body',
            operator: matchType,
            value: keyword.trim(),
          },
        ],
        actions,
        createdAt: initialRule?.createdAt || Date.now(),
      };

      await db.automationRules.put(rule);

      await db.auditLogs.add({
        id: `audit_${Date.now()}`,
        timestamp: Date.now(),
        eventType: initialRule ? 'UPDATE_CHATBOT_RULE' : 'CREATE_CHATBOT_RULE',
        actor: 'USER',
        description: `Chatbot rule "${name}" ${initialRule ? 'updated' : 'created'}`,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save chatbot rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                {initialRule ? 'Edit Chatbot Rule' : 'New Chatbot Rule'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Automatically reply to customer keywords and trigger workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Rule Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Rule Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greeting Autoresponder, Pricing Inquiry"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Trigger & Condition */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Matching Type</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              >
                <option value="contains">Contains</option>
                <option value="equals">Exact Match</option>
                <option value="starts_with">Starts With</option>
                <option value="regex">Regex</option>
              </select>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Keyword / Pattern</label>
              <input
                type="text"
                required
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. hello, pricing, help, /order"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Response Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Auto Reply Text</label>
              <span className="text-[10px] text-zinc-500">Supports &#123;&#123;contact.name&#125;&#125;</span>
            </div>
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Namaste {{contact.name}} 👋 Thank you for reaching out! How can we assist you today?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 resize-none font-sans"
            />
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Additional Automated Actions
            </h3>

            {/* Tag Assignment */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-zinc-400" />
                <span>Assign Tag to Contact</span>
              </label>
              <input
                type="text"
                value={tagToAdd}
                onChange={(e) => setTagToAdd(e.target.value)}
                placeholder="e.g. Inquired, Hot Lead, New Customer"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Workflow Trigger */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5 text-zinc-400" />
                <span>Trigger Visual Workflow (Optional)</span>
              </label>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              >
                <option value="">None (Reply only)</option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !keyword.trim()}
              className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
            >
              <Bot className="h-4 w-4" />
              <span>{initialRule ? 'Save Rule' : 'Create Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

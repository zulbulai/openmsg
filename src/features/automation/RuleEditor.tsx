import React, { useState, useEffect } from 'react';
import { X, Save, Zap } from 'lucide-react';
import { AutomationRule, Tag, Workflow } from '@/storage/schemas';
import { db } from '@/storage/db';
import { AutomationService } from '@/core/automation/automation-service';

interface RuleEditorProps {
  rule?: AutomationRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<string>('KEYWORD_MATCH');
  const [keywordPattern, setKeywordPattern] = useState('');
  const [keywordMatchType, setKeywordMatchType] = useState<'exact' | 'contains' | 'starts_with' | 'regex'>('contains');
  const [actionType, setActionType] = useState<string>('SEND_MESSAGE');
  const [actionMessageText, setActionMessageText] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [followUpTitle, setFollowUpTitle] = useState('Follow up with lead');
  const [followUpDelayHours, setFollowUpDelayHours] = useState(24);

  // Live tester
  const [testInput, setTestInput] = useState('');
  const [testMatches, setTestMatches] = useState<boolean | null>(null);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    db.tags.toArray().then(setAvailableTags);
    db.workflows.toArray().then(setAvailableWorkflows);

    if (rule) {
      setName(rule.name);
      setTrigger(rule.trigger);
      const textCond = rule.conditions?.find((c) => c.field === 'text');
      if (textCond) {
        setKeywordPattern(String(textCond.value || ''));
        setKeywordMatchType((textCond.operator as any) || 'contains');
      }
      const firstAction = rule.actions?.[0];
      if (firstAction) {
        setActionType(firstAction.type);
        setActionMessageText((firstAction.config.text as string) || '');
        setSelectedTagId((firstAction.config.tagId as string) || '');
        setSelectedWorkflowId((firstAction.config.workflowId as string) || '');
        setWebhookUrl((firstAction.config.url as string) || '');
        setFollowUpTitle((firstAction.config.title as string) || 'Follow up with lead');
        setFollowUpDelayHours(Number(firstAction.config.delayHours) || 24);
      }
    } else {
      setName('');
      setTrigger('KEYWORD_MATCH');
      setKeywordPattern('');
      setFollowUpTitle('Follow up with lead');
      setFollowUpDelayHours(24);
      setKeywordMatchType('contains');
      setActionType('SEND_MESSAGE');
      setActionMessageText('');
      setSelectedTagId('');
      setSelectedWorkflowId('');
      setWebhookUrl('');
    }
  }, [rule, isOpen]);

  // Live Keyword Test
  useEffect(() => {
    if (!testInput || !keywordPattern) {
      setTestMatches(null);
      return;
    }
    const match = AutomationService.matchKeyword(testInput, keywordPattern, keywordMatchType);
    setTestMatches(match);
  }, [testInput, keywordPattern, keywordMatchType]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Rule name is required.');
      return;
    }

    const conditions: Array<{ field: string; operator: string; value: unknown }> = [];
    if (trigger === 'KEYWORD_MATCH' || keywordPattern) {
      conditions.push({
        field: 'text',
        operator: keywordMatchType,
        value: keywordPattern.trim(),
      });
    }

    const actionConfig: Record<string, unknown> = {};
    if (actionType === 'SEND_MESSAGE') actionConfig.text = actionMessageText;
    else if (actionType === 'ADD_TAG' || actionType === 'REMOVE_TAG') actionConfig.tagId = selectedTagId;
    else if (actionType === 'START_WORKFLOW') actionConfig.workflowId = selectedWorkflowId;
    else if (actionType === 'WEBHOOK') actionConfig.url = webhookUrl;
    else if (actionType === 'CREATE_FOLLOW_UP') {
      actionConfig.title = followUpTitle;
      actionConfig.delayHours = followUpDelayHours;
    }

    const record: AutomationRule = {
      id: rule?.id || `rule_${Date.now()}`,
      name: name.trim(),
      enabled: rule?.enabled ?? true,
      trigger,
      conditions,
      actions: [{ type: actionType, config: actionConfig }],
      createdAt: rule?.createdAt || Date.now(),
    };

    await db.automationRules.put(record);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-emerald-400" />
            {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex flex-col gap-4">
          <div>
            <label className="font-semibold text-zinc-300 block mb-1">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Auto-Reply to Pricing inquiries"
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-300 block mb-1">Trigger Event</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-200"
            >
              <option value="KEYWORD_MATCH">Keyword Match on Incoming Message</option>
              <option value="MESSAGE_RECEIVED">Any Incoming Message</option>
              <option value="CONTACT_CREATED">Contact Created</option>
              <option value="TAG_ADDED">Tag Assigned</option>
              <option value="MANUAL">Manual Trigger</option>
            </select>
          </div>

          {/* Keyword Condition Builder */}
          {trigger === 'KEYWORD_MATCH' && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-2.5">
              <span className="font-semibold text-zinc-200">Keyword Condition</span>
              <div className="flex gap-2">
                <select
                  value={keywordMatchType}
                  onChange={(e) => setKeywordMatchType(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact Match</option>
                  <option value="starts_with">Starts With</option>
                  <option value="regex">Regex</option>
                </select>
                <input
                  type="text"
                  value={keywordPattern}
                  onChange={(e) => setKeywordPattern(e.target.value)}
                  placeholder="Keywords (e.g. price, pricing, cost)"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100"
                  required
                />
              </div>

              {/* Live Preview Tester */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-1">
                <label className="text-[11px] text-zinc-400">Test Live Match:</label>
                <input
                  type="text"
                  placeholder="Type a sample customer message here..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-[11px]"
                />
                {testMatches !== null && (
                  <span
                    className={`text-[11px] font-semibold mt-0.5 ${
                      testMatches ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {testMatches ? '✓ Rule MATCHES this sample message!' : '✗ Does not match'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions Builder */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-2.5">
            <span className="font-semibold text-zinc-200">Action to Execute</span>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200"
            >
              <option value="SEND_MESSAGE">Send Automated WhatsApp Message</option>
              <option value="ADD_TAG">Assign CRM Tag</option>
              <option value="REMOVE_TAG">Remove CRM Tag</option>
              <option value="START_WORKFLOW">Trigger Visual Workflow</option>
              <option value="WEBHOOK">Send Outbound Webhook</option>
              <option value="CREATE_FOLLOW_UP">Schedule CRM Follow-up</option>
            </select>

            {actionType === 'SEND_MESSAGE' && (
              <textarea
                rows={3}
                value={actionMessageText}
                onChange={(e) => setActionMessageText(e.target.value)}
                placeholder="Message reply content (supports {{contact.name}})..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-100"
                required
              />
            )}

            {(actionType === 'ADD_TAG' || actionType === 'REMOVE_TAG') && (
              <select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200"
                required
              >
                <option value="">Select a tag...</option>
                {availableTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            {actionType === 'START_WORKFLOW' && (
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200"
                required
              >
                <option value="">Select a workflow...</option>
                {availableWorkflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}

            {actionType === 'WEBHOOK' && (
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.example.com/webhook"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100"
                required
              />
            )}

            {actionType === 'CREATE_FOLLOW_UP' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  placeholder="Follow-up title..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100"
                  required
                />
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Due in</span>
                  <input
                    type="number"
                    min="1"
                    value={followUpDelayHours}
                    onChange={(e) => setFollowUpDelayHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100"
                  />
                  <span className="text-zinc-400">hours</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

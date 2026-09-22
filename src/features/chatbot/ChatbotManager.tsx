import React, { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Sparkles,
  Tag,
  Workflow,
  MessageSquare,
} from 'lucide-react';
import { AutomationRule } from '@/storage/schemas';
import { db } from '@/storage/db';
import { ChatbotRuleModal } from './ChatbotRuleModal';
import { SafeTemplate } from '@/core/template/safe-template';

export const ChatbotManager: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Sandbox state
  const [simulatedMessage, setSimulatedMessage] = useState('');
  const [simulatedMatch, setSimulatedMatch] = useState<{
    rule: AutomationRule;
    reply: string;
  } | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const allRules = await db.automationRules
        .where('trigger')
        .equals('MESSAGE_RECEIVED')
        .toArray();
      setRules(allRules);
    } catch (err) {
      console.error('Failed to load chatbot rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    await db.automationRules.put(updated);
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chatbot rule?')) return;
    await db.automationRules.delete(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Run simulation whenever simulatedMessage changes
  useEffect(() => {
    if (!simulatedMessage.trim()) {
      setSimulatedMatch(null);
      return;
    }

    const text = simulatedMessage.toLowerCase().trim();
    const matched = rules.find((rule) => {
      if (!rule.enabled) return false;
      const condition = rule.conditions?.[0];
      if (!condition || typeof condition.value !== 'string') return false;

      const target = condition.value.toLowerCase().trim();
      switch (condition.operator) {
        case 'equals':
          return text === target;
        case 'starts_with':
          return text.startsWith(target);
        case 'regex':
          try {
            return new RegExp(condition.value, 'i').test(text);
          } catch {
            return false;
          }
        case 'contains':
        default:
          return text.includes(target);
      }
    });

    if (matched) {
      const sendAction = matched.actions.find((a) => a.type === 'SEND_MESSAGE');
      const rawText = (sendAction?.config?.text as string) || '';
      const reply = SafeTemplate.render(rawText, {
        contact: { name: 'Customer', phone: '+91 98765 43210' },
      });
      setSimulatedMatch({ rule: matched, reply });
    } else {
      setSimulatedMatch(null);
    }
  }, [simulatedMessage, rules]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-400" />
            Chatbot Autoresponders
          </h1>
          <p className="text-xs text-zinc-400">
            Configure instant automated replies, keyword triggers, and workflow launches for WhatsApp Web.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRule(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-purple-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>New Chatbot Rule</span>
        </button>
      </div>

      {/* Simulator Sandbox */}
      <div className="bg-gradient-to-r from-purple-950/30 via-zinc-900 to-zinc-900 border border-purple-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Test Chatbot Simulation Sandbox</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={simulatedMessage}
            onChange={(e) => setSimulatedMessage(e.target.value)}
            placeholder="Type a test customer message (e.g. 'hello', 'pricing', 'help')..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          {simulatedMessage && (
            <button
              onClick={() => setSimulatedMessage('')}
              className="px-3 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-xl"
            >
              Clear
            </button>
          )}
        </div>

        {simulatedMessage && (
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs space-y-1.5 animate-in fade-in">
            {simulatedMatch ? (
              <>
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>
                    Matched Rule: <strong>{simulatedMatch.rule.name}</strong>
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-lg text-zinc-200 font-sans border border-zinc-800 text-xs">
                  {simulatedMatch.reply || 'No automated text reply configured (Tag or Workflow only).'}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500">
                <XCircle className="h-3.5 w-3.5" />
                <span>No active chatbot rules matched this message.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Loading chatbot rules...</div>
        ) : rules.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <Bot className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No Chatbot Rules Configured</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Create your first chatbot rule to automatically respond to frequent customer queries 24/7.
            </p>
            <button
              onClick={() => {
                setEditingRule(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl text-xs font-semibold transition"
            >
              Create First Rule
            </button>
          </div>
        ) : (
          rules.map((rule) => {
            const condition = rule.conditions?.[0];
            const sendAction = rule.actions?.find((a) => a.type === 'SEND_MESSAGE');
            const tagAction = rule.actions?.find((a) => a.type === 'ADD_TAG');
            const workflowAction = rule.actions?.find((a) => a.type === 'START_WORKFLOW');

            return (
              <div
                key={rule.id}
                className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 transition flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-zinc-100 truncate">{rule.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        rule.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                      }`}
                    >
                      {rule.enabled ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  {/* Trigger Details */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                    <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                      {condition?.operator}: &ldquo;{condition?.value as string}&rdquo;
                    </span>

                    {sendAction && (
                      <span className="text-[11px] bg-zinc-800 px-2 py-0.5 rounded-lg text-zinc-300 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>Replies text</span>
                      </span>
                    )}

                    {tagAction && (
                      <span className="text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>Tag: {tagAction.config.tag as string}</span>
                      </span>
                    )}

                    {workflowAction && (
                      <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Workflow className="h-3 w-3" />
                        <span>Launches flow</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                      rule.enabled
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                        : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                    }`}
                  >
                    {rule.enabled ? 'Pause' : 'Activate'}
                  </button>

                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setModalOpen(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-750 transition"
                    title="Edit Rule"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition"
                    title="Delete Rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ChatbotRuleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadRules}
        initialRule={editingRule}
      />
    </div>
  );
};

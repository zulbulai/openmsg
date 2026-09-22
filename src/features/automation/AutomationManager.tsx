import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AutomationRule } from '@/storage/schemas';
import { db } from '@/storage/db';
import { RuleEditor } from './RuleEditor';

export const AutomationManager: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const loadRules = async () => {
    const list = await db.automationRules.toArray();
    setRules(list);
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleEnabled = async (rule: AutomationRule) => {
    const updated = !rule.enabled;
    await db.automationRules.update(rule.id, { enabled: updated });
    await loadRules();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this automation rule?')) {
      await db.automationRules.delete(id);
      await loadRules();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-400" />
            Automation Rules Engine
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Auto-replies, keyword routers, automated tags, and event webhooks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-emerald-400">
            Deduplication: Active
          </span>
          <button
            onClick={() => {
              setEditingRule(null);
              setIsEditorOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
          >
            <Plus className="h-4 w-4" />
            New Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-3">
        {rules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20 flex flex-col items-center">
            <Zap className="h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Automation Rules Configured</h3>
            <p className="text-zinc-500 text-xs max-w-sm mt-1 mb-4">
              Set up instant keyword responses, contact tagging, or outbound webhook triggers.
            </p>
            <button
              onClick={() => {
                setEditingRule(null);
                setIsEditorOpen(true);
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
            >
              Create Rule
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleEnabled(rule)}
                  className={`mt-0.5 p-1 rounded-full transition ${
                    rule.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                  title={rule.enabled ? 'Enabled (click to disable)' : 'Disabled (click to enable)'}
                >
                  {rule.enabled ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-zinc-100">{rule.name}</h4>
                    <span className="text-[10px] font-mono uppercase bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                      Trigger: {rule.trigger}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-zinc-400 text-[11px]">
                    {rule.conditions?.map((c, i) => (
                      <span key={i} className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        Match ({c.operator}): &quot;{String(c.value)}&quot;
                      </span>
                    ))}

                    <span className="text-zinc-600">→</span>

                    {rule.actions?.map((a, i) => (
                      <span key={i} className="text-emerald-400 font-semibold">
                        Action: {a.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setIsEditorOpen(true);
                  }}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition"
                  title="Edit Rule"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400 transition"
                  title="Delete Rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <RuleEditor
        rule={editingRule}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={loadRules}
      />
    </div>
  );
};

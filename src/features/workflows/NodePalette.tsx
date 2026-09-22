import React, { useState } from 'react';
import {
  Play,
  MessageSquare,
  GitBranch,
  Clock,
  Tag,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { nodeRegistry } from '@/workflow-engine/nodes/registry';
import { NodeCategory } from '@/workflow-engine/nodes/types';

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

const CATEGORY_ICONS: Record<NodeCategory, React.ReactNode> = {
  trigger: <Play className="h-3.5 w-3.5 text-violet-400" />,
  messaging: <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />,
  logic: <GitBranch className="h-3.5 w-3.5 text-amber-400" />,
  flow: <Clock className="h-3.5 w-3.5 text-sky-400" />,
  contact: <Tag className="h-3.5 w-3.5 text-pink-400" />,
  integration: <Radio className="h-3.5 w-3.5 text-orange-400" />,
  ai: <Sparkles className="h-3.5 w-3.5 text-purple-400" />,
};

const CATEGORIES: Array<{ key: NodeCategory; label: string }> = [
  { key: 'trigger', label: 'Triggers' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'logic', label: 'Logic & Branching' },
  { key: 'flow', label: 'Flow & Delays' },
  { key: 'contact', label: 'CRM & Contacts' },
  { key: 'integration', label: 'Integrations' },
  { key: 'ai', label: 'AI Assistant' },
];

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    trigger: true,
    messaging: true,
    logic: true,
    flow: true,
    contact: true,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-900/40 flex flex-col h-full overflow-y-auto text-xs shrink-0">
      <div className="p-3 border-b border-zinc-800">
        <h3 className="font-bold text-zinc-200">Node Palette</h3>
        <p className="text-[10px] text-zinc-400">Click a node to add it to the canvas</p>
      </div>

      <div className="p-2 flex flex-col gap-1.5">
        {CATEGORIES.map((cat) => {
          const isOpen = openCategories[cat.key];
          const nodes = nodeRegistry.getByCategory(cat.key);

          return (
            <div key={cat.key} className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-zinc-800/50 transition text-zinc-300 font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  {CATEGORY_ICONS[cat.key]}
                  {cat.label}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                )}
              </button>

              {/* Node items */}
              {isOpen && (
                <div className="p-1.5 flex flex-col gap-1 bg-zinc-950/40 border-t border-zinc-800/50">
                  {nodes.map((n) => (
                    <button
                      key={n.type}
                      onClick={() => onAddNode(n.type)}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700 transition flex items-center justify-between group"
                    >
                      <div className="truncate">
                        <div className="font-medium text-zinc-200 group-hover:text-emerald-400 transition truncate">
                          {n.label}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {n.description}
                        </div>
                      </div>
                      <Plus className="h-3 w-3 text-zinc-500 group-hover:text-emerald-400 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

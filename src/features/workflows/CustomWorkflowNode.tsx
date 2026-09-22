import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Play,
  MessageSquare,
  GitBranch,
  Clock,
  Tag,
  Radio,
  Sparkles,
  CheckCircle2,
  List,
  LayoutGrid,
} from 'lucide-react';
import { nodeRegistry } from '@/workflow-engine/nodes/registry';

export const CustomWorkflowNode: React.FC<NodeProps> = ({ type, data, selected }) => {
  const definition = nodeRegistry.get(type || '');

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'trigger':
        return 'border-violet-500/50 bg-violet-950/40 text-violet-400';
      case 'messaging':
        return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400';
      case 'logic':
        return 'border-amber-500/50 bg-amber-950/40 text-amber-400';
      case 'flow':
        return 'border-sky-500/50 bg-sky-950/40 text-sky-400';
      case 'contact':
        return 'border-pink-500/50 bg-pink-950/40 text-pink-400';
      case 'integration':
        return 'border-orange-500/50 bg-orange-950/40 text-orange-400';
      case 'ai':
        return 'border-purple-500/50 bg-purple-950/40 text-purple-400';
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-300';
    }
  };

  const renderIcon = (type?: string) => {
    switch (type) {
      case 'START':
      case 'MANUAL':
        return <Play className="h-4 w-4 text-violet-400" />;
      case 'TEXT':
      case 'SEND_TEXT':
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case 'BUTTONS':
        return <LayoutGrid className="h-4 w-4 text-emerald-400" />;
      case 'LIST':
        return <List className="h-4 w-4 text-emerald-400" />;
      case 'CONDITION':
        return <GitBranch className="h-4 w-4 text-amber-400" />;
      case 'DELAY':
        return <Clock className="h-4 w-4 text-sky-400" />;
      case 'ADD_TAG':
      case 'TAG_CONTACT':
        return <Tag className="h-4 w-4 text-pink-400" />;
      case 'WEBHOOK':
      case 'HTTP_REQUEST':
        return <Radio className="h-4 w-4 text-orange-400" />;
      case 'AI_PROMPT':
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-zinc-400" />;
    }
  };

  const isCondition = type === 'CONDITION';
  const isStart = type === 'START' || type === 'MESSAGE_RECEIVED' || type === 'KEYWORD' || type === 'MANUAL';
  const isEnd = type === 'END';

  return (
    <div
      className={`min-w-[190px] rounded-xl border-2 bg-zinc-900 p-3 shadow-lg transition-all ${
        selected ? 'border-emerald-500 shadow-emerald-500/10 ring-2 ring-emerald-500/20' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Input Port */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !bg-zinc-600 !border-2 !border-zinc-900 hover:!bg-emerald-400 transition"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border ${getCategoryColor(definition?.category)}`}>
          {renderIcon(type)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-zinc-100 truncate">
            {definition?.label || type}
          </h4>
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">
            {definition?.category || 'General'}
          </span>
        </div>
      </div>

      {/* Node Content Preview */}
      <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-1.5 rounded border border-zinc-800/80 truncate">
        {data.text ? (
          String(data.text)
        ) : data.content ? (
          String(data.content)
        ) : data.variable ? (
          `${String(data.variable)} ${String(data.operator || '==')} ${String(data.value || '')}`
        ) : data.seconds ? (
          `Wait ${data.seconds}s`
        ) : data.tagId ? (
          `Tag: ${data.tagId}`
        ) : data.url ? (
          String(data.url)
        ) : (
          <span className="italic text-zinc-600">Click to configure</span>
        )}
      </div>

      {/* Output Ports */}
      {!isEnd && !isCondition && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !bg-emerald-500 !border-2 !border-zinc-900 hover:!bg-emerald-400 transition"
        />
      )}

      {/* Condition Branching Handles (True / False) */}
      {isCondition && (
        <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-bold">
          <div className="relative text-emerald-400">
            True
            <Handle
              type="source"
              id="true"
              position={Position.Bottom}
              className="!left-3 !h-3 !w-3 !bg-emerald-500 !border-2 !border-zinc-900"
            />
          </div>
          <div className="relative text-rose-400">
            False
            <Handle
              type="source"
              id="false"
              position={Position.Bottom}
              className="!left-auto !right-3 !h-3 !w-3 !bg-rose-500 !border-2 !border-zinc-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Trash2, Copy, AlertCircle, X } from 'lucide-react';
import { WorkflowNode } from '@/storage/schemas';
import { nodeRegistry } from '@/workflow-engine/nodes/registry';

interface NodeInspectorProps {
  node: WorkflowNode | null;
  onUpdateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (node: WorkflowNode) => void;
  onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onUpdateNodeData,
  onDeleteNode,
  onDuplicateNode,
  onClose,
}) => {
  if (!node) {
    return null;
  }

  const def = nodeRegistry.get(node.type);
  const validation = nodeRegistry.validateNode(node);

  const updateField = (key: string, value: unknown) => {
    onUpdateNodeData(node.id, {
      ...node.data,
      [key]: value,
    });
  };

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-900/60 flex flex-col h-full overflow-y-auto text-xs shrink-0">
      {/* Inspector Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
        <div>
          <h3 className="font-bold text-zinc-100">{def?.label || node.type} Settings</h3>
          <span className="text-[10px] text-zinc-500 font-mono">ID: {node.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateNode(node)}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
            title="Duplicate Node"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDeleteNode(node.id)}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400"
            title="Delete Node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Validation Warnings */}
      {!validation.valid && validation.errors && (
        <div className="m-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 text-[11px]">
            {validation.errors.map((e, idx) => (
              <span key={idx}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Fields by Node Type */}
      <div className="p-4 flex flex-col gap-4">
        {/* TEXT / SEND_TEXT */}
        {(node.type === 'SEND_TEXT' || node.type === 'TEXT') && (
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-300">Message Content</label>
            <textarea
              rows={4}
              value={(node.data.text as string) || (node.data.content as string) || ''}
              onChange={(e) => {
                updateField('text', e.target.value);
                updateField('content', e.target.value);
              }}
              placeholder="e.g. Hello {{contact.name}}, your order {{variables.orderId}} is confirmed!"
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-zinc-500">
              Supported variables: {'{{contact.name}}'}, {'{{contact.phone}}'}, {'{{variables.key}}'}
            </span>
          </div>
        )}

        {/* CONDITION */}
        {node.type === 'CONDITION' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Variable Name</label>
              <input
                type="text"
                value={(node.data.variable as string) || ''}
                onChange={(e) => updateField('variable', e.target.value)}
                placeholder="e.g. intent or orderTotal"
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-100"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Operator</label>
              <select
                value={(node.data.operator as string) || 'equals'}
                onChange={(e) => updateField('operator', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-200"
              >
                <option value="equals">Equals (==)</option>
                <option value="not_equals">Not Equals (!=)</option>
                <option value="contains">Contains text</option>
                <option value="not_contains">Does not contain</option>
                <option value="starts_with">Starts with</option>
                <option value="ends_with">Ends with</option>
                <option value="greater_than">Greater than (&gt;)</option>
                <option value="less_than">Less than (&lt;)</option>
                <option value="exists">Exists / Is Not Empty</option>
                <option value="regex">Regular Expression</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Target Value</label>
              <input
                type="text"
                value={(node.data.value as string) || ''}
                onChange={(e) => updateField('value', e.target.value)}
                placeholder="Value to compare against"
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-100"
              />
            </div>
          </div>
        )}

        {/* DELAY */}
        {node.type === 'DELAY' && (
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-300">Wait Duration (Seconds)</label>
            <input
              type="number"
              min={1}
              value={Number(node.data.seconds) || 10}
              onChange={(e) => updateField('seconds', Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-100"
            />
            <span className="text-[10px] text-zinc-500">
              Survives browser restarts via persistent Chrome Alarms.
            </span>
          </div>
        )}

        {/* ADD_TAG / REMOVE_TAG */}
        {(node.type === 'ADD_TAG' || node.type === 'REMOVE_TAG' || node.type === 'TAG_CONTACT') && (
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-300">Tag Name or ID</label>
            <input
              type="text"
              value={(node.data.tagId as string) || (node.data.tagName as string) || ''}
              onChange={(e) => {
                updateField('tagId', e.target.value);
                updateField('tagName', e.target.value);
              }}
              placeholder="e.g. VIP or Interested"
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-100"
            />
          </div>
        )}

        {/* WEBHOOK / HTTP_REQUEST */}
        {(node.type === 'WEBHOOK' || node.type === 'HTTP_REQUEST') && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Target Endpoint URL</label>
              <input
                type="url"
                value={(node.data.url as string) || ''}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://api.example.com/webhook"
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-100"
              />
              <span className="text-[10px] text-emerald-400">SSRF Guard protected</span>
            </div>

            {node.type === 'HTTP_REQUEST' && (
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">HTTP Method</label>
                <select
                  value={(node.data.method as string) || 'GET'}
                  onChange={(e) => updateField('method', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-200"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            )}

            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Secret / Token (Optional)</label>
              <input
                type="password"
                value={(node.data.secret as string) || ''}
                onChange={(e) => updateField('secret', e.target.value)}
                placeholder="HMAC secret header"
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-100"
              />
            </div>
          </div>
        )}

        {/* AI_PROMPT */}
        {node.type === 'AI_PROMPT' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Prompt Template</label>
              <textarea
                rows={3}
                value={(node.data.prompt as string) || ''}
                onChange={(e) => updateField('prompt', e.target.value)}
                placeholder="e.g. Generate a welcoming reply for {{contact.name}}"
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg p-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Output Variable</label>
              <input
                type="text"
                value={(node.data.outputVariable as string) || 'aiReply'}
                onChange={(e) => updateField('outputVariable', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-zinc-100"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Save,
  Play,
  Workflow as WorkflowIcon,
  CheckCircle,
} from 'lucide-react';
import { Workflow, WorkflowNode, WorkflowEdge, Contact } from '@/storage/schemas';
import { db } from '@/storage/db';
import { CustomWorkflowNode } from './CustomWorkflowNode';
import { NodePalette } from './NodePalette';
import { NodeInspector } from './NodeInspector';
import { WorkflowDebugger } from './WorkflowDebugger';

const nodeTypes = {
  START: CustomWorkflowNode,
  MESSAGE_RECEIVED: CustomWorkflowNode,
  KEYWORD: CustomWorkflowNode,
  SCHEDULE: CustomWorkflowNode,
  MANUAL: CustomWorkflowNode,
  TEXT: CustomWorkflowNode,
  SEND_TEXT: CustomWorkflowNode,
  SEND_IMAGE: CustomWorkflowNode,
  SEND_VIDEO: CustomWorkflowNode,
  SEND_AUDIO: CustomWorkflowNode,
  SEND_DOCUMENT: CustomWorkflowNode,
  BUTTONS: CustomWorkflowNode,
  LIST: CustomWorkflowNode,
  CONDITION: CustomWorkflowNode,
  SWITCH: CustomWorkflowNode,
  DELAY: CustomWorkflowNode,
  JUMP: CustomWorkflowNode,
  START_WORKFLOW: CustomWorkflowNode,
  END: CustomWorkflowNode,
  ADD_TAG: CustomWorkflowNode,
  REMOVE_TAG: CustomWorkflowNode,
  UPDATE_CONTACT: CustomWorkflowNode,
  ADD_NOTE: CustomWorkflowNode,
  WEBHOOK: CustomWorkflowNode,
  HTTP_REQUEST: CustomWorkflowNode,
  AI_PROMPT: CustomWorkflowNode,
  TAG_CONTACT: CustomWorkflowNode,
};

interface WorkflowCanvasProps {
  initialWorkflow?: Workflow;
  onSaved?: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ initialWorkflow, onSaved }) => {
  const [workflowName, setWorkflowName] = useState(
    initialWorkflow?.name || 'Customer Onboarding Flow'
  );
  const [isActive, setIsActive] = useState(initialWorkflow?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (initialWorkflow?.nodes as Node[]) || [
      {
        id: 'node_start',
        type: 'START',
        position: { x: 250, y: 50 },
        data: {},
      },
      {
        id: 'node_msg',
        type: 'SEND_TEXT',
        position: { x: 250, y: 180 },
        data: { text: 'Hello {{contact.name}}! Welcome to our service.' },
      },
    ]
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (initialWorkflow?.edges as Edge[]) || [
      {
        id: 'e_start_msg',
        source: 'node_start',
        target: 'node_msg',
        animated: true,
      },
    ]
  );

  useEffect(() => {
    db.contacts.limit(10).toArray().then(setContacts);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const handleAddNode = (type: string) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newNode: Node = {
      id,
      type,
      position: {
        x: 250 + Math.random() * 50,
        y: 100 + nodes.length * 90,
      },
      data: {},
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };

  const handleUpdateNodeData = (nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  };

  const handleDuplicateNode = (nodeToDup: WorkflowNode) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const dup: Node = {
      id,
      type: nodeToDup.type,
      position: {
        x: nodeToDup.position.x + 40,
        y: nodeToDup.position.y + 40,
      },
      data: { ...nodeToDup.data },
    };
    setNodes((nds) => [...nds, dup]);
    setSelectedNodeId(id);
  };

  const selectedNode = (nodes.find((n) => n.id === selectedNodeId) as WorkflowNode) || null;

  const currentWorkflowData: Workflow = {
    id: initialWorkflow?.id || `wf_${Date.now()}`,
    name: workflowName,
    description: initialWorkflow?.description || 'Automated customer workflow',
    isActive,
    triggerType: (nodes.find((n) => n.type === 'START')?.type as any) || 'MANUAL',
    triggerConfig: {},
    nodes: nodes as WorkflowNode[],
    edges: edges as WorkflowEdge[],
    createdAt: initialWorkflow?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    try {
      const record: Workflow = {
        ...currentWorkflowData,
        isActive: publish ? true : isActive,
        updatedAt: Date.now(),
      };
      await db.workflows.put(record);
      if (publish) setIsActive(true);
      if (onSaved) onSaved();
      alert(publish ? 'Workflow Published & Activated!' : 'Workflow Draft Saved!');
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Top Workflow Builder Bar */}
      <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/40 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <WorkflowIcon className="h-5 w-5 text-emerald-400" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent font-bold text-sm text-zinc-100 border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5"
          />
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {isActive ? 'Active' : 'Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowDebugger(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
          >
            <Play className="h-3.5 w-3.5 text-emerald-400" />
            Test Flow
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
          >
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5 transition"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Publish Flow
          </button>
        </div>
      </div>

      {/* Main Workspace: Palette + React Flow Canvas + Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette onAddNode={handleAddNode} />

        {/* Center: React Flow Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-zinc-950"
          >
            <Background color="#27272a" gap={20} size={1.5} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-zinc-900 !border !border-zinc-800 !fill-zinc-400 !text-zinc-400" />
            <MiniMap
              nodeStrokeColor="#3f3f46"
              nodeColor="#18181b"
              maskColor="rgba(0, 0, 0, 0.7)"
              className="!bg-zinc-900 !border !border-zinc-800 rounded-lg overflow-hidden"
            />
          </ReactFlow>
        </div>

        {/* Right: Node Configuration Inspector */}
        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            onUpdateNodeData={handleUpdateNodeData}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Test Execution Debugger Modal */}
      {showDebugger && (
        <WorkflowDebugger
          workflow={currentWorkflowData}
          contacts={contacts}
          onClose={() => setShowDebugger(false)}
        />
      )}
    </div>
  );
};

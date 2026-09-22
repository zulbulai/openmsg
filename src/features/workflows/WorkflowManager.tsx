import React, { useState, useEffect } from 'react';
import {
  Workflow as WorkflowIcon,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { Workflow } from '@/storage/schemas';
import { db } from '@/storage/db';
import { WorkflowCanvas } from './WorkflowCanvas';

export const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadWorkflows = async () => {
    const list = await db.workflows.toArray();
    setWorkflows(list);
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleCreateNew = () => {
    const newWf: Workflow = {
      id: `wf_${Date.now()}`,
      name: 'New WhatsApp Workflow',
      description: 'Automated response flow',
      isActive: false,
      triggerType: 'MANUAL',
      triggerConfig: {},
      nodes: [
        {
          id: 'node_start',
          type: 'START',
          position: { x: 250, y: 50 },
          data: {},
        },
        {
          id: 'node_text_1',
          type: 'SEND_TEXT',
          position: { x: 250, y: 180 },
          data: { text: 'Hello {{contact.name}}! Thank you for reaching out.' },
        },
      ],
      edges: [
        {
          id: 'edge_start_1',
          source: 'node_start',
          target: 'node_text_1',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setActiveWorkflow(newWf);
    setIsEditing(true);
  };

  const handleToggleActive = async (wf: Workflow) => {
    const updated = !wf.isActive;
    await db.workflows.update(wf.id, { isActive: updated });
    await loadWorkflows();
  };

  const handleDuplicate = async (wf: Workflow) => {
    const dup: Workflow = {
      ...wf,
      id: `wf_${Date.now()}_copy`,
      name: `${wf.name} (Copy)`,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.workflows.put(dup);
    await loadWorkflows();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      await db.workflows.delete(id);
      await loadWorkflows();
    }
  };

  if (isEditing && activeWorkflow) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="h-10 border-b border-zinc-800 bg-zinc-900/90 px-4 flex items-center">
          <button
            onClick={() => {
              setIsEditing(false);
              setActiveWorkflow(null);
              loadWorkflows();
            }}
            className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-medium transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Workflow List
          </button>
        </div>
        <WorkflowCanvas
          initialWorkflow={activeWorkflow}
          onSaved={() => {
            loadWorkflows();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <WorkflowIcon className="h-5 w-5 text-emerald-400" />
            Visual Workflow Builder
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Automate conversations, logic branching, delays, and CRM updates
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20 flex flex-col items-center">
            <WorkflowIcon className="h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Workflows Created</h3>
            <p className="text-zinc-500 text-xs max-w-sm mt-1 mb-4">
              Build your first automated customer flow using our React Flow visual builder.
            </p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
            >
              Get Started
            </button>
          </div>
        ) : (
          workflows.map((wf) => (
            <div
              key={wf.id}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition flex flex-col justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      wf.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {wf.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" /> Draft
                      </>
                    )}
                  </span>

                  <span className="text-[10px] text-zinc-500">
                    {wf.nodes.length} Nodes
                  </span>
                </div>

                <h3 className="font-bold text-sm text-zinc-100 mb-1">{wf.name}</h3>
                <p className="text-zinc-400 text-xs line-clamp-2">{wf.description}</p>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => handleToggleActive(wf)}
                  className={`text-[11px] font-semibold transition ${
                    wf.isActive ? 'text-zinc-400 hover:text-amber-400' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  {wf.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(wf)}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveWorkflow(wf);
                      setIsEditing(true);
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400 transition"
                    title="Edit in Visual Canvas"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(wf.id)}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

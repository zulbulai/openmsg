/**
 * OpenMsg Pipeline Management Modal
 * Create, edit, duplicate, archive, and safely delete CRM pipelines.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Archive,
  Star,
  Layers,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CrmPipeline } from '@/storage/schemas';
import { PipelineRepository } from '@/storage/repositories/pipeline.repository';
import { db } from '@/storage/db';

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (selectedPipelineId?: string) => void;
  initialMode?: 'manage' | 'create';
}

export const PipelineModal: React.FC<PipelineModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  initialMode = 'manage',
}) => {
  const [viewMode, setViewMode] = useState<'manage' | 'create' | 'delete'>(initialMode);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);

  // New pipeline form state
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');
  const [stagesConfig, setStagesConfig] = useState<Array<{ name: string; color: string }>>([
    { name: 'New Lead', color: '#3b82f6' },
    { name: 'Contacted', color: '#6366f1' },
    { name: 'Qualified', color: '#8b5cf6' },
    { name: 'Customer', color: '#10b981' },
    { name: 'Lost', color: '#ef4444' },
  ]);

  // Safe delete state
  const [pipelineToDelete, setPipelineToDelete] = useState<CrmPipeline | null>(null);
  const [contactsToMigrateCount, setContactsToMigrateCount] = useState(0);
  const [targetMigrationPipelineId, setTargetMigrationPipelineId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPipelines = async () => {
    const list = await PipelineRepository.listPipelines(includeArchived);
    setPipelines(list);
  };

  useEffect(() => {
    if (isOpen) {
      setViewMode(initialMode);
      loadPipelines();
    }
  }, [isOpen, initialMode, includeArchived]);

  if (!isOpen) return null;

  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) return;

    setIsProcessing(true);
    try {
      const created = await PipelineRepository.createPipeline({
        name: newPipelineName.trim(),
        description: newPipelineDesc.trim(),
        stages: stagesConfig.map((s, idx) => ({
          name: s.name,
          color: s.color,
          position: idx,
          isWon: s.name.toLowerCase() === 'customer' || s.name.toLowerCase() === 'won',
          isLost: s.name.toLowerCase() === 'lost',
          isClosed:
            s.name.toLowerCase() === 'customer' ||
            s.name.toLowerCase() === 'won' ||
            s.name.toLowerCase() === 'lost',
        })),
      });

      setNewPipelineName('');
      setNewPipelineDesc('');
      await loadPipelines();
      onUpdated(created.id);
      onClose();
    } catch (err: any) {
      alert(`Failed to create pipeline: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async (pipeline: CrmPipeline) => {
    setIsProcessing(true);
    try {
      const cloned = await PipelineRepository.duplicatePipeline(pipeline.id);
      await loadPipelines();
      onUpdated(cloned.id);
    } catch (err: any) {
      alert(`Failed to duplicate pipeline: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleArchive = async (pipeline: CrmPipeline) => {
    try {
      if (pipeline.isArchived) {
        await PipelineRepository.unarchivePipeline(pipeline.id);
      } else {
        await PipelineRepository.archivePipeline(pipeline.id);
      }
      await loadPipelines();
      onUpdated();
    } catch (err: any) {
      alert(err.message || String(err));
    }
  };

  const handleSetDefault = async (pipeline: CrmPipeline) => {
    try {
      await PipelineRepository.updatePipeline(pipeline.id, { isDefault: true });
      await loadPipelines();
      onUpdated(pipeline.id);
    } catch (err: any) {
      alert(err.message || String(err));
    }
  };

  const initDeletePipeline = async (pipeline: CrmPipeline) => {
    if (pipeline.isDefault) {
      alert('The default sales pipeline cannot be deleted.');
      return;
    }
    const count = await db.contacts.filter((c) => c.pipelineId === pipeline.id).count();
    setPipelineToDelete(pipeline);
    setContactsToMigrateCount(count);

    const otherPipe = pipelines.find((p) => p.id !== pipeline.id && !p.isArchived);
    if (otherPipe) {
      setTargetMigrationPipelineId(otherPipe.id);
    }
    setViewMode('delete');
  };

  const handleConfirmDelete = async () => {
    if (!pipelineToDelete) return;
    setIsProcessing(true);
    try {
      await PipelineRepository.deletePipeline(pipelineToDelete.id, targetMigrationPipelineId);
      await loadPipelines();
      onUpdated();
      setViewMode('manage');
    } catch (err: any) {
      alert(`Failed to delete pipeline: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              {viewMode === 'create'
                ? 'Create New Pipeline'
                : viewMode === 'delete'
                ? `Delete Pipeline: ${pipelineToDelete?.name}`
                : 'Manage CRM Pipelines'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Create Mode */}
        {viewMode === 'create' && (
          <form onSubmit={handleCreatePipeline} className="p-5 flex flex-col gap-4 overflow-y-auto">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Pipeline Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="e.g. Enterprise Leads, Support Escalations..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Description</label>
              <input
                type="text"
                value={newPipelineDesc}
                onChange={(e) => setNewPipelineDesc(e.target.value)}
                placeholder="Optional description of this pipeline's purpose"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Stages Customization */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-semibold">Initial Pipeline Stages</label>
                <button
                  type="button"
                  onClick={() =>
                    setStagesConfig((prev) => [...prev, { name: `Stage ${prev.length + 1}`, color: '#3b82f6' }])
                  }
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium text-[11px]"
                >
                  <Plus className="h-3 w-3" />
                  Add Stage
                </button>
              </div>

              <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                {stagesConfig.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={st.color}
                      onChange={(e) => {
                        const next = [...stagesConfig];
                        next[idx].color = e.target.value;
                        setStagesConfig(next);
                      }}
                      className="h-6 w-7 bg-transparent rounded border border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const next = [...stagesConfig];
                        next[idx].name = e.target.value;
                        setStagesConfig(next);
                      }}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-100"
                    />
                    {stagesConfig.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setStagesConfig((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('manage')}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium"
              >
                Back to Pipelines
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-40 shadow-lg shadow-emerald-950/40"
              >
                <Plus className="h-4 w-4" />
                {isProcessing ? 'Creating...' : 'Create Pipeline'}
              </button>
            </div>
          </form>
        )}

        {/* Delete Mode */}
        {viewMode === 'delete' && pipelineToDelete && (
          <div className="p-5 flex flex-col gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Safe Pipeline Deletion</strong>
                <span>
                  Deleting this pipeline will permanently remove its stages. If it has active contacts,
                  they must be safely migrated to another active pipeline.
                </span>
              </div>
            </div>

            <div>
              <span className="text-zinc-300 font-semibold block mb-1">Contacts in this pipeline:</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {contactsToMigrateCount} {contactsToMigrateCount === 1 ? 'lead' : 'leads'}
              </span>
            </div>

            {contactsToMigrateCount > 0 && (
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Migrate leads to: <span className="text-rose-400">*</span>
                </label>
                <select
                  value={targetMigrationPipelineId}
                  onChange={(e) => setTargetMigrationPipelineId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {pipelines
                    .filter((p) => p.id !== pipelineToDelete.id && !p.isArchived)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('manage')}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                {isProcessing ? 'Deleting...' : 'Migrate & Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Manage List Mode */}
        {viewMode === 'manage' && (
          <div className="p-5 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-emerald-500"
                />
                <span>Include archived pipelines</span>
              </label>

              <button
                type="button"
                onClick={() => setViewMode('create')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                New Pipeline
              </button>
            </div>

            {/* Pipeline List */}
            <div className="flex flex-col gap-2">
              {pipelines.map((pipe) => (
                <div
                  key={pipe.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    pipe.isArchived
                      ? 'border-zinc-800/50 bg-zinc-950/40 opacity-60'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-zinc-100 text-xs truncate">{pipe.name}</strong>
                      {pipe.isDefault && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Default
                        </span>
                      )}
                      {pipe.isArchived && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                      {pipe.stages.length} stages • {pipe.description || 'No description'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!pipe.isDefault && !pipe.isArchived && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(pipe)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400"
                        title="Set as default pipeline"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDuplicate(pipe)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      title="Duplicate pipeline structure"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    {!pipe.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(pipe)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400"
                        title={pipe.isArchived ? 'Restore pipeline' : 'Archive pipeline'}
                      >
                        {pipe.isArchived ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}

                    {!pipe.isDefault && (
                      <button
                        type="button"
                        onClick={() => initDeletePipeline(pipe)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
                        title="Delete pipeline safely"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

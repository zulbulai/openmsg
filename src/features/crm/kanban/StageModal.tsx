/**
 * OpenMsg Stage Management Modal
 * Configure stage properties: name, color, WIP limits, won/lost analytics status, and safe deletion.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  Trophy,
  XCircle,
  CheckCircle,
  Sliders,
} from 'lucide-react';
import { CrmStage, CrmPipeline } from '@/storage/schemas';
import { PipelineRepository } from '@/storage/repositories/pipeline.repository';
import { db } from '@/storage/db';

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  pipeline: CrmPipeline;
  stage?: CrmStage | null;
  mode: 'create' | 'edit' | 'delete';
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#f97316', // orange
  '#10b981', // emerald
  '#14b8a6', // teal
  '#ef4444', // red
  '#71717a', // zinc
];

export const StageModal: React.FC<StageModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  pipeline,
  stage,
  mode,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [wipLimit, setWipLimit] = useState<string>('');
  const [wipLimitAction, setWipLimitAction] = useState<'WARN' | 'PREVENT'>('WARN');
  const [statusType, setStatusType] = useState<'open' | 'won' | 'lost' | 'closed'>('open');
  const [contactsInStageCount, setContactsInStageCount] = useState(0);
  const [migrationStageId, setMigrationStageId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (stage) {
      setName(stage.name || '');
      setDescription(stage.description || '');
      setColor(stage.color || '#3b82f6');
      setWipLimit(stage.wipLimit ? String(stage.wipLimit) : '');
      setWipLimitAction(stage.wipLimitAction || 'WARN');

      if (stage.isWon) setStatusType('won');
      else if (stage.isLost) setStatusType('lost');
      else if (stage.isClosed) setStatusType('closed');
      else setStatusType('open');

      // Check contacts in this stage
      db.contacts.filter((c) => c.stageId === stage.id).count().then(setContactsInStageCount);

      // Default migration target to another stage
      const otherStage = pipeline.stages.find((s) => s.id !== stage.id);
      if (otherStage) {
        setMigrationStageId(otherStage.id);
      }
    } else {
      setName('');
      setDescription('');
      setColor('#3b82f6');
      setWipLimit('');
      setWipLimitAction('WARN');
      setStatusType('open');
      setContactsInStageCount(0);
    }
  }, [stage, pipeline, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsProcessing(true);
    try {
      const parsedWip = wipLimit ? Number(wipLimit) : undefined;
      const isClosed = statusType !== 'open';
      const isWon = statusType === 'won';
      const isLost = statusType === 'lost';

      if (mode === 'create') {
        await PipelineRepository.addStage(pipeline.id, {
          name: name.trim(),
          description: description.trim(),
          color,
          icon: isWon ? 'Trophy' : isLost ? 'XCircle' : 'Circle',
          probability: isWon ? 100 : isLost ? 0 : 50,
          isClosed,
          isWon,
          isLost,
          wipLimit: parsedWip && parsedWip > 0 ? parsedWip : undefined,
          wipLimitAction,
        });
      } else if (stage) {
        await PipelineRepository.updateStage(pipeline.id, stage.id, {
          name: name.trim(),
          description: description.trim(),
          color,
          isClosed,
          isWon,
          isLost,
          wipLimit: parsedWip && parsedWip > 0 ? parsedWip : undefined,
          wipLimitAction,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      alert(`Failed to save stage: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!stage) return;
    if (pipeline.stages.length <= 1) {
      alert('A pipeline must have at least one stage.');
      return;
    }

    if (contactsInStageCount > 0 && !migrationStageId) {
      alert('Please select a destination stage to migrate contacts to.');
      return;
    }

    setIsProcessing(true);
    try {
      await PipelineRepository.deleteStage(pipeline.id, stage.id, migrationStageId);
      onSaved();
      onClose();
    } catch (err: any) {
      alert(`Failed to delete stage: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              {mode === 'delete'
                ? `Delete Stage: ${stage?.name}`
                : mode === 'create'
                ? 'Create New Stage'
                : `Edit Stage: ${stage?.name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Delete Mode Confirmation Form */}
        {mode === 'delete' ? (
          <div className="p-5 flex flex-col gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Stage Deletion Safety</strong>
                <span>
                  Deleting this stage will remove it permanently. To protect data integrity, all contacts
                  currently in this stage must be safely moved to another stage.
                </span>
              </div>
            </div>

            <div>
              <span className="text-zinc-300 font-semibold block mb-1">Contacts affected:</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {contactsInStageCount} {contactsInStageCount === 1 ? 'contact' : 'contacts'}
              </span>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Move associated contacts to: <span className="text-rose-400">*</span>
              </label>
              <select
                value={migrationStageId}
                onChange={(e) => setMigrationStageId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {pipeline.stages
                  .filter((s) => s.id !== stage?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                {isProcessing ? 'Deleting...' : 'Migrate & Delete Stage'}
              </button>
            </div>
          </div>
        ) : (
          /* Create / Edit Form */
          <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Stage Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Qualified Lead"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Budget and timeline confirmed"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Stage Color Picker */}
            <div>
              <label className="text-zinc-300 font-semibold block mb-1.5">Stage Color</label>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border transition ${
                        color === c ? 'ring-2 ring-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-8 bg-transparent cursor-pointer rounded border border-zinc-700"
                  title="Custom Color"
                />
              </div>
            </div>

            {/* WIP Limits */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  WIP Limit (Max Cards)
                </label>
                <input
                  type="number"
                  min="0"
                  value={wipLimit}
                  onChange={(e) => setWipLimit(e.target.value)}
                  placeholder="Optional (e.g. 10)"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">When Limit Exceeded</label>
                <select
                  value={wipLimitAction}
                  onChange={(e) => setWipLimitAction(e.target.value as 'WARN' | 'PREVENT')}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="WARN">Warn only</option>
                  <option value="PREVENT">Prevent movement</option>
                </select>
              </div>
            </div>

            {/* Stage Classification (Analytics) */}
            <div>
              <label className="text-zinc-300 font-semibold block mb-1.5">
                Stage Classification (for Analytics)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'open', label: 'Open / In Progress', icon: CheckCircle, color: 'text-zinc-400' },
                  { id: 'won', label: 'Deal Won (Customer)', icon: Trophy, color: 'text-emerald-400' },
                  { id: 'lost', label: 'Deal Lost', icon: XCircle, color: 'text-rose-400' },
                  { id: 'closed', label: 'Closed / Archived', icon: CheckCircle, color: 'text-sky-400' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusType(item.id as any)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                        statusType === item.id
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-zinc-100 font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${item.color} shrink-0`} />
                      <span className="text-[11px] truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
              >
                <Save className="h-4 w-4" />
                {isProcessing ? 'Saving...' : mode === 'create' ? 'Create Stage' : 'Save Stage'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

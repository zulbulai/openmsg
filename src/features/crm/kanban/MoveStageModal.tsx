/**
 * OpenMsg Move Stage Modal
 * Keyboard and menu-accessible stage mover for contacts (alternative to drag-and-drop).
 */

import React, { useState } from 'react';
import { X, ArrowRight, User, CheckCircle2 } from 'lucide-react';
import { Contact, CrmPipeline } from '@/storage/schemas';
import { ContactRepository } from '@/storage/repositories/contact.repository';

interface MoveStageModalProps {
  contact: Contact | null;
  pipeline: CrmPipeline;
  isOpen: boolean;
  onClose: () => void;
  onMoved: () => void;
}

export const MoveStageModal: React.FC<MoveStageModalProps> = ({
  contact,
  pipeline,
  isOpen,
  onClose,
  onMoved,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(
    contact?.stageId || pipeline.stages[0]?.id || ''
  );
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !contact) return null;

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) return;

    setIsMoving(true);
    setError(null);
    try {
      await ContactRepository.moveStage(contact.id, selectedStageId, pipeline.id, 'MANUAL');
      onMoved();
      onClose();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">Move Contact Stage</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleMove} className="p-5 flex flex-col gap-4">
          {/* Contact summary */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {contact.name ? contact.name.substring(0, 2).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-zinc-200 truncate">{contact.name}</div>
              <div className="text-[11px] font-mono text-zinc-500">{contact.phone || contact.id}</div>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px]">
              {error}
            </div>
          )}

          <div>
            <label className="text-zinc-300 font-semibold block mb-2">Select Destination Stage</label>
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto p-1">
              {pipeline.stages.map((stage) => {
                const isCurrent = contact.stageId === stage.id;
                const isSelected = selectedStageId === stage.id;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`px-3 py-2 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300 font-bold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color || '#3b82f6' }}
                      />
                      <span className="truncate">{stage.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] text-zinc-500 font-normal">(Current)</span>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMoving || selectedStageId === contact.stageId}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <ArrowRight className="h-4 w-4" />
              {isMoving ? 'Moving...' : 'Move to Stage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

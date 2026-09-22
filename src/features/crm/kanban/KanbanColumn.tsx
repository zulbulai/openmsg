/**
 * OpenMsg Kanban Stage Column
 * Renders stage header with counts, WIP limits, deal value, droppable zone, and card list.
 */

import React, { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  AlertTriangle,
  Trophy,
  XCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Contact, CrmStage, Tag } from '@/storage/schemas';
import { KanbanCard, CardDensity, BoardViewSettings } from './KanbanCard';

interface KanbanColumnProps {
  stage: CrmStage;
  stages: CrmStage[];
  contacts: Contact[];
  tags: Tag[];
  density: CardDensity;
  viewSettings: BoardViewSettings;
  selectedContactIds: Set<string>;
  onToggleSelectContact: (id: string) => void;
  onOpenProfile: (contact: Contact) => void;
  onOpenWhatsApp: (contact: Contact) => void;
  onMoveToStage: (contact: Contact) => void;
  onFollowUp: (contact: Contact) => void;
  onAddNote: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onArchiveContact: (contact: Contact) => void;
  onAddLeadToStage: (stageId: string) => void;
  onEditStage: (stage: CrmStage) => void;
  onDeleteStage: (stage: CrmStage) => void;
  onMoveStagePosition: (stageId: string, direction: 'left' | 'right') => void;
  onDropContact: (contactId: string, targetStageId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  stages,
  contacts,
  tags,
  density,
  viewSettings,
  selectedContactIds,
  onToggleSelectContact,
  onOpenProfile,
  onOpenWhatsApp,
  onMoveToStage,
  onFollowUp,
  onAddNote,
  onEditContact,
  onArchiveContact,
  onAddLeadToStage,
  onEditStage,
  onDeleteStage,
  onMoveStagePosition,
  onDropContact,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Compute column metrics
  const totalValue = contacts.reduce((sum, c) => sum + (Number(c.leadValue) || 0), 0);
  const currency = contacts[0]?.leadCurrency || 'INR';

  const formatCurrency = (val: number) => {
    if (val === 0) return null;
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(val);
    } catch {
      return `${currency} ${val.toLocaleString()}`;
    }
  };

  const isWipExceeded = stage.wipLimit && stage.wipLimit > 0 && contacts.length > stage.wipLimit;
  const isWipReached = stage.wipLimit && stage.wipLimit > 0 && contacts.length === stage.wipLimit;

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only leave if leaving this column element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const contactId = e.dataTransfer.getData('text/plain');
    if (contactId) {
      onDropContact(contactId, stage.id);
    }
  };

  const handleCardDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData('text/plain', contactId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const stageIndex = stages.findIndex((s) => s.id === stage.id);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-80 min-w-[280px] max-w-[320px] flex flex-col bg-zinc-900/40 border rounded-2xl transition-colors duration-150 shrink-0 h-full overflow-hidden ${
        isDragOver
          ? 'border-emerald-500/60 bg-emerald-950/10 ring-2 ring-emerald-500/20'
          : 'border-zinc-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/70 flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Stage Name & Color */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: stage.color || '#3b82f6' }}
            />
            <h3 className="font-bold text-xs text-zinc-100 truncate" title={stage.name}>
              {stage.name}
            </h3>

            {/* Closed / Won / Lost Indicators */}
            {stage.isWon && (
              <span title="Won Stage">
                <Trophy className="h-3 w-3 text-emerald-400 shrink-0" />
              </span>
            )}
            {stage.isLost && (
              <span title="Lost Stage">
                <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
              </span>
            )}
            {stage.isClosed && !stage.isWon && !stage.isLost && (
              <span title="Closed Stage">
                <CheckCircle className="h-3 w-3 text-zinc-400 shrink-0" />
              </span>
            )}
          </div>

          {/* Counts and WIP Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                isWipExceeded
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : isWipReached
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
              title={
                stage.wipLimit
                  ? `WIP: ${contacts.length} / ${stage.wipLimit} (${stage.wipLimitAction || 'WARN'})`
                  : `${contacts.length} leads`
              }
            >
              {stage.wipLimit ? `${contacts.length}/${stage.wipLimit}` : contacts.length}
            </span>

            {/* Quick Add Lead to Stage Button */}
            <button
              type="button"
              onClick={() => onAddLeadToStage(stage.id)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition"
              title={`Add lead to ${stage.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            {/* Column Options Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                title="Stage options"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-6 z-40 w-44 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl p-1 flex flex-col gap-0.5 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onAddLeadToStage(stage.id);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-400" />
                      Add Lead Here
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEditStage(stage);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                      Edit Stage
                    </button>

                    {stageIndex > 0 && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onMoveStagePosition(stage.id, 'left');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 text-zinc-400" />
                        Move Left
                      </button>
                    )}

                    {stageIndex < stages.length - 1 && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onMoveStagePosition(stage.id, 'right');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                        Move Right
                      </button>
                    )}

                    {stages.length > 1 && (
                      <>
                        <div className="h-px bg-zinc-800 my-1" />
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onDeleteStage(stage);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-rose-400 hover:text-rose-300 flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Stage...
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stage Value & WIP Warning Row */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-mono">
            {totalValue > 0 ? formatCurrency(totalValue) : <span className="text-zinc-600">No value</span>}
          </span>

          {isWipExceeded && (
            <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
              <AlertTriangle className="h-2.5 w-2.5" />
              WIP Limit Exceeded
            </span>
          )}
        </div>
      </div>

      {/* Cards Scrollable Droppable Zone */}
      <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-2 min-h-[120px]">
        {contacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800/60 rounded-xl text-center text-zinc-600 text-xs gap-2">
            <span>No leads in this stage</span>
            <button
              type="button"
              onClick={() => onAddLeadToStage(stage.id)}
              className="text-emerald-400 hover:underline text-[11px] font-medium"
            >
              + Add Lead
            </button>
          </div>
        ) : (
          contacts.map((contact) => (
            <KanbanCard
              key={contact.id}
              contact={contact}
              stages={stages}
              tags={tags}
              density={density}
              viewSettings={viewSettings}
              isSelected={selectedContactIds.has(contact.id)}
              onToggleSelect={onToggleSelectContact}
              onOpenProfile={onOpenProfile}
              onOpenWhatsApp={onOpenWhatsApp}
              onMoveToStage={onMoveToStage}
              onFollowUp={onFollowUp}
              onAddNote={onAddNote}
              onEdit={onEditContact}
              onArchive={onArchiveContact}
              onDragStart={handleCardDragStart}
            />
          ))
        )}
      </div>

      {/* Column Footer */}
      <div className="p-2 border-t border-zinc-800/60 bg-zinc-900/30 shrink-0">
        <button
          type="button"
          onClick={() => onAddLeadToStage(stage.id)}
          className="w-full py-1.5 px-3 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="h-3.5 w-3.5 text-emerald-400" />
          Add Lead
        </button>
      </div>
    </div>
  );
};

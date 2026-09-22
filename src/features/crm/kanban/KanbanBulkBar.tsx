/**
 * OpenMsg Kanban Bulk Selection Action Bar
 * Floating bar offering bulk stage movement, tagging, archiving, follow-ups, and export.
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  ArrowRight,
  Tag as TagIcon,
  Calendar,
  Archive,
  Download,
  X,
} from 'lucide-react';
import { CrmStage, Tag } from '@/storage/schemas';

interface KanbanBulkBarProps {
  selectedCount: number;
  stages: CrmStage[];
  tags: Tag[];
  onClearSelection: () => void;
  onBulkMoveStage: (targetStageId: string) => void;
  onBulkAddTag: (tagId: string) => void;
  onBulkArchive: () => void;
  onBulkExportCSV: () => void;
  onBulkCreateFollowUp: () => void;
}

export const KanbanBulkBar: React.FC<KanbanBulkBarProps> = ({
  selectedCount,
  stages,
  tags,
  onClearSelection,
  onBulkMoveStage,
  onBulkAddTag,
  onBulkArchive,
  onBulkExportCSV,
  onBulkCreateFollowUp,
}) => {
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');

  if (selectedCount === 0) return null;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3 text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Selected Counter */}
      <div className="flex items-center gap-2 pr-3 border-r border-zinc-800 shrink-0">
        <CheckSquare className="h-4 w-4 text-emerald-400" />
        <span className="font-bold text-zinc-100">{selectedCount}</span>
        <span className="text-zinc-400">selected</span>
      </div>

      {/* Bulk Move Stage */}
      <div className="flex items-center gap-1.5 shrink-0">
        <select
          value={selectedStageId}
          onChange={(e) => setSelectedStageId(e.target.value)}
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500 max-w-[130px]"
        >
          <option value="">Move to Stage...</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selectedStageId}
          onClick={() => {
            if (selectedStageId) {
              onBulkMoveStage(selectedStageId);
              setSelectedStageId('');
            }
          }}
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition"
          title="Apply Stage Move"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bulk Tag */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500 max-w-[120px]"
          >
            <option value="">Add Tag...</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedTagId}
            onClick={() => {
              if (selectedTagId) {
                onBulkAddTag(selectedTagId);
                setSelectedTagId('');
              }
            }}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition"
            title="Apply Tag"
          >
            <TagIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Follow-up Shortcut */}
      <button
        type="button"
        onClick={onBulkCreateFollowUp}
        className="px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 transition shrink-0"
        title="Create Follow-up for all selected"
      >
        <Calendar className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">Follow-up</span>
      </button>

      {/* Export */}
      <button
        type="button"
        onClick={onBulkExportCSV}
        className="px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 transition shrink-0"
        title="Export selected contacts to CSV"
      >
        <Download className="h-3.5 w-3.5 text-sky-400" />
        <span className="hidden sm:inline">CSV</span>
      </button>

      {/* Archive */}
      <button
        type="button"
        onClick={onBulkArchive}
        className="px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 flex items-center gap-1.5 transition shrink-0"
        title="Archive selected contacts"
      >
        <Archive className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Archive</span>
      </button>

      {/* Clear Selection */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition shrink-0 ml-1"
        title="Clear Selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

/**
 * OpenMsg Kanban Filter Drawer & Saved Filters
 * Multi-criteria filter panel with saved filter management.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Filter,
  Bookmark,
  Trash2,
  Check,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Tag, SavedFilter } from '@/storage/schemas';
import { db } from '@/storage/db';

export interface BoardFilterState {
  tagIds: string[];
  priorities: string[];
  followUpStatus: 'all' | 'none' | 'today' | 'overdue' | 'upcoming';
  contactStatus: 'active' | 'archived' | 'all';
  dateRange: 'all' | 'today' | 'this_week' | 'this_month';
}

export const INITIAL_FILTER_STATE: BoardFilterState = {
  tagIds: [],
  priorities: [],
  followUpStatus: 'all',
  contactStatus: 'active',
  dateRange: 'all',
};

interface KanbanFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: BoardFilterState;
  onApplyFilters: (filters: BoardFilterState) => void;
  onResetFilters: () => void;
  allTags: Tag[];
}

export const KanbanFilterDrawer: React.FC<KanbanFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  allTags,
}) => {
  const [localFilters, setLocalFilters] = useState<BoardFilterState>(filters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [newSavedFilterName, setNewSavedFilterName] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
      db.savedFilters.toArray().then(setSavedFilters);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tagId: string) => {
    const next = localFilters.tagIds.includes(tagId)
      ? localFilters.tagIds.filter((id) => id !== tagId)
      : [...localFilters.tagIds, tagId];
    const updated = { ...localFilters, tagIds: next };
    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  const togglePriority = (p: string) => {
    const next = localFilters.priorities.includes(p)
      ? localFilters.priorities.filter((item) => item !== p)
      : [...localFilters.priorities, p];
    const updated = { ...localFilters, priorities: next };
    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  const handleSaveCurrentFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSavedFilterName.trim()) return;

    const saved: SavedFilter = {
      id: `flt_${Date.now()}`,
      name: newSavedFilterName.trim(),
      filter: localFilters as unknown as Record<string, unknown>,
      createdAt: Date.now(),
    };

    await db.savedFilters.put(saved);
    setSavedFilters((prev) => [...prev, saved]);
    setNewSavedFilterName('');
    setIsSavingFilter(false);
  };

  const handleDeleteSavedFilter = async (id: string) => {
    await db.savedFilters.delete(id);
    setSavedFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const handleApplySavedFilter = (f: SavedFilter) => {
    const loaded = f.filter as unknown as BoardFilterState;
    setLocalFilters(loaded);
    onApplyFilters(loaded);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-88 max-w-[90vw] bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl text-xs overflow-hidden">
        {/* Header */}
        <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-zinc-100">Filter Board Leads</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-5">
          {/* Saved Filters Section */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between font-semibold text-zinc-200">
              <span className="flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-amber-400" />
                Saved Presets
              </span>
              <button
                type="button"
                onClick={() => setIsSavingFilter(!isSavingFilter)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
              >
                <Plus className="h-3 w-3" />
                Save Current
              </button>
            </div>

            {isSavingFilter && (
              <form onSubmit={handleSaveCurrentFilter} className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="Preset name (e.g. Hot VIPs)..."
                  value={newSavedFilterName}
                  onChange={(e) => setNewSavedFilterName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded px-2.5 py-1 text-zinc-100 placeholder-zinc-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newSavedFilterName.trim()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium disabled:opacity-40"
                >
                  Save
                </button>
              </form>
            )}

            {savedFilters.length === 0 ? (
              <span className="text-[11px] text-zinc-500 italic">No saved filter presets yet.</span>
            ) : (
              <div className="flex flex-col gap-1 mt-1">
                {savedFilters.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplySavedFilter(f)}
                      className="text-left text-zinc-300 hover:text-emerald-400 font-medium truncate flex-1"
                    >
                      {f.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedFilter(f.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition"
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Multi-Select */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-200">Priority</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'urgent', label: 'Urgent', color: 'rose' },
                { key: 'high', label: 'High', color: 'amber' },
                { key: 'medium', label: 'Medium', color: 'zinc' },
                { key: 'low', label: 'Low', color: 'blue' },
              ].map((p) => {
                const active = localFilters.priorities.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePriority(p.key)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow-Up Status */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-200">Follow-up Due</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Due Today' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'none', label: 'No Follow-up' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...localFilters,
                      followUpStatus: item.id as BoardFilterState['followUpStatus'],
                    };
                    setLocalFilters(updated);
                    onApplyFilters(updated);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition ${
                    localFilters.followUpStatus === item.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Multi-Select */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-200">Tags ({allTags.length})</span>
            {allTags.length === 0 ? (
              <span className="text-zinc-500 text-[11px]">No CRM tags created yet.</span>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {allTags.map((tag) => {
                  const active = localFilters.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition ${
                        active
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color || '#10b981' }}
                      />
                      <span>{tag.name}</span>
                      {active && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact Status */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-200">Contact Status</span>
            <div className="flex gap-1.5">
              {[
                { id: 'active', label: 'Active Leads' },
                { id: 'archived', label: 'Archived' },
                { id: 'all', label: 'Show All' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...localFilters,
                      contactStatus: item.id as BoardFilterState['contactStatus'],
                    };
                    setLocalFilters(updated);
                    onApplyFilters(updated);
                  }}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition text-center ${
                    localFilters.contactStatus === item.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-200">Creation Date</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Created Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...localFilters,
                      dateRange: item.id as BoardFilterState['dateRange'],
                    };
                    setLocalFilters(updated);
                    onApplyFilters(updated);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition ${
                    localFilters.dateRange === item.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              setLocalFilters(INITIAL_FILTER_STATE);
              onResetFilters();
            }}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

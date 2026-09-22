/**
 * OpenMsg Kanban Board Header
 * Pipeline selector, quick stats, search bar, filters, density toggles, sorting, and add lead action.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  Search,
  Filter,
  Plus,
  BarChart3,
  SlidersHorizontal,
  ArrowUpDown,
  PlusCircle,
  Settings2,
  X,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { CrmPipeline } from '@/storage/schemas';
import { CardDensity, BoardViewSettings } from './KanbanCard';

export type CardSortOption =
  | 'lastActivity'
  | 'createdDate'
  | 'followUpDate'
  | 'priority'
  | 'leadValue'
  | 'name';

export type QuickFilterType =
  | 'all'
  | 'new_leads'
  | 'hot_leads'
  | 'follow_up_today'
  | 'overdue'
  | 'customers'
  | 'lost';

interface KanbanHeaderProps {
  pipelines: CrmPipeline[];
  activePipeline: CrmPipeline | null;
  onSelectPipeline: (pipelineId: string) => void;
  onCreatePipeline: () => void;
  onManagePipelines: () => void;
  onOpenAnalytics: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilterCount: number;
  onToggleFilterDrawer: () => void;
  quickFilter: QuickFilterType;
  onSelectQuickFilter: (q: QuickFilterType) => void;
  density: CardDensity;
  onChangeDensity: (d: CardDensity) => void;
  sortBy: CardSortOption;
  onChangeSortBy: (s: CardSortOption) => void;
  viewSettings: BoardViewSettings;
  onToggleViewSetting: (key: keyof BoardViewSettings) => void;
  onAddNewLead: () => void;
  totalLeadsCount: number;
  totalPipelineValue: number;
  wonLeadsCount: number;
  currency?: string;
}

export const KanbanHeader: React.FC<KanbanHeaderProps> = ({
  pipelines,
  activePipeline,
  onSelectPipeline,
  onCreatePipeline,
  onManagePipelines,
  onOpenAnalytics,
  searchQuery,
  onSearchChange,
  activeFilterCount,
  onToggleFilterDrawer,
  quickFilter,
  onSelectQuickFilter,
  density,
  onChangeDensity,
  sortBy,
  onChangeSortBy,
  viewSettings,
  onToggleViewSetting,
  onAddNewLead,
  totalLeadsCount,
  totalPipelineValue,
  wonLeadsCount,
  currency = 'INR',
}) => {
  const [pipelineDropdownOpen, setPipelineDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  const formatCurrency = (val: number) => {
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

  const QUICK_FILTERS: Array<{ id: QuickFilterType; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'new_leads', label: 'New Leads' },
    { id: 'hot_leads', label: 'Hot Leads' },
    { id: 'follow_up_today', label: 'Follow-up Today' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'customers', label: 'Customers' },
    { id: 'lost', label: 'Lost' },
  ];

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur shrink-0 flex flex-col">
      {/* Top Header Row */}
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* Left: Pipeline Selector and Stats */}
        <div className="flex items-center gap-3">
          {/* Pipeline Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPipelineDropdownOpen(!pipelineDropdownOpen)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700/80 hover:border-zinc-600 text-zinc-100 font-bold text-xs flex items-center gap-2 transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>{activePipeline?.name || 'Select Pipeline'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>

            {pipelineDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPipelineDropdownOpen(false)} />
                <div className="absolute left-0 top-10 z-40 w-64 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1.5 flex flex-col gap-0.5 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Pipelines
                  </div>

                  {pipelines.map((pipe) => (
                    <button
                      key={pipe.id}
                      onClick={() => {
                        onSelectPipeline(pipe.id);
                        setPipelineDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                        activePipeline?.id === pipe.id
                          ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                          : 'text-zinc-300 hover:bg-zinc-800/80'
                      }`}
                    >
                      <span className="truncate">{pipe.name}</span>
                      {pipe.isDefault && (
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
                          Default
                        </span>
                      )}
                    </button>
                  ))}

                  <div className="h-px bg-zinc-800 my-1" />

                  <button
                    onClick={() => {
                      setPipelineDropdownOpen(false);
                      onCreatePipeline();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-emerald-400 flex items-center gap-2 font-medium"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Create Pipeline...
                  </button>

                  <button
                    onClick={() => {
                      setPipelineDropdownOpen(false);
                      onManagePipelines();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                  >
                    <Settings2 className="h-3.5 w-3.5 text-zinc-400" />
                    Manage Pipelines...
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Pipeline Quick Stats */}
          <div className="hidden sm:flex items-center gap-2.5 text-xs border-l border-zinc-800 pl-3">
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <Users className="h-3.5 w-3.5 text-zinc-500" />
              <strong className="text-zinc-200">{totalLeadsCount}</strong> Leads
            </span>

            {totalPipelineValue > 0 && (
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Value: <strong className="text-emerald-400 font-mono">{formatCurrency(totalPipelineValue)}</strong>
              </span>
            )}

            {wonLeadsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                <strong className="text-zinc-200">{wonLeadsCount}</strong> Won
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Analytics Trigger */}
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition"
            title="Pipeline Analytics"
          >
            <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden md:inline">Analytics</span>
          </button>

          {/* Add Lead Primary Button */}
          <button
            type="button"
            onClick={onAddNewLead}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Controls & Quick Filter Row */}
      <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search leads by name, phone, tags, company..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={onToggleFilterDrawer}
            className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition ${
              activeFilterCount > 0
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="hidden lg:flex items-center gap-1">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelectQuickFilter(f.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                quickFilter === f.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort, Density & View Options */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition"
              title="Sort cards"
            >
              <ArrowUpDown className="h-3 w-3 text-zinc-400" />
              <span className="capitalize text-[11px]">
                {sortBy === 'lastActivity'
                  ? 'Recent'
                  : sortBy === 'followUpDate'
                  ? 'Follow-up'
                  : sortBy === 'leadValue'
                  ? 'Value'
                  : sortBy}
              </span>
            </button>

            {sortDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
                <div className="absolute right-0 top-8 z-40 w-44 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl p-1 flex flex-col gap-0.5 text-xs">
                  <button
                    onClick={() => {
                      onChangeSortBy('lastActivity');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded ${
                      sortBy === 'lastActivity' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Last Activity
                  </button>
                  <button
                    onClick={() => {
                      onChangeSortBy('createdDate');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded ${
                      sortBy === 'createdDate' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Created Date
                  </button>
                  <button
                    onClick={() => {
                      onChangeSortBy('followUpDate');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded ${
                      sortBy === 'followUpDate' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Follow-up Date
                  </button>
                  <button
                    onClick={() => {
                      onChangeSortBy('priority');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded ${
                      sortBy === 'priority' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Priority
                  </button>
                  <button
                    onClick={() => {
                      onChangeSortBy('leadValue');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded ${
                      sortBy === 'leadValue' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Lead Value
                  </button>
                  <button
                    onClick={() => {
                      onChangeSortBy('name');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded ${
                      sortBy === 'name' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Name (A-Z)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Density Switcher */}
          <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => onChangeDensity('compact')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                density === 'compact' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => onChangeDensity('comfortable')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                density === 'comfortable' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => onChangeDensity('expanded')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                density === 'expanded' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Expanded
            </button>
          </div>

          {/* View Settings Toggles */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title="Customize card fields"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>

            {viewDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setViewDropdownOpen(false)} />
                <div className="absolute right-0 top-8 z-40 w-48 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl p-2 flex flex-col gap-1.5 text-xs">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase px-1">Display Fields</div>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={viewSettings.showAvatars}
                      onChange={() => onToggleViewSetting('showAvatars')}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-zinc-300 text-[11px]">Show Avatars</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={viewSettings.showPhone}
                      onChange={() => onToggleViewSetting('showPhone')}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-zinc-300 text-[11px]">Show Phone</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={viewSettings.showTags}
                      onChange={() => onToggleViewSetting('showTags')}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-zinc-300 text-[11px]">Show Tags</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={viewSettings.showFollowUp}
                      onChange={() => onToggleViewSetting('showFollowUp')}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-zinc-300 text-[11px]">Show Follow-up</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={viewSettings.showLeadValue}
                      onChange={() => onToggleViewSetting('showLeadValue')}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-zinc-300 text-[11px]">Show Lead Value</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * OpenMsg Kanban Board
 * Production-quality visual CRM pipeline with drag-and-drop, real IndexedDB sync,
 * multi-criteria filters, saved filters, bulk operations, and full sub-system integrations.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Plus,
  RefreshCw,
  FilterX,
  Layers,
} from 'lucide-react';
import { Contact, CrmPipeline, CrmStage, Tag } from '@/storage/schemas';
import { PipelineRepository } from '@/storage/repositories/pipeline.repository';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';
import { useUIStore } from '@/ui/store';
import { CRMDataTransfer } from '@/core/crm/import-export';
import { crmEvents } from '@/core/events/crm-events';

import { KanbanHeader, CardSortOption, QuickFilterType } from './KanbanHeader';
import { KanbanColumn } from './KanbanColumn';
import { CardDensity, BoardViewSettings } from './KanbanCard';
import { KanbanFilterDrawer, BoardFilterState, INITIAL_FILTER_STATE } from './KanbanFilterDrawer';
import { KanbanBulkBar } from './KanbanBulkBar';
import { LeadModal } from './LeadModal';
import { StageModal } from './StageModal';
import { PipelineModal } from './PipelineModal';
import { MoveStageModal } from './MoveStageModal';
import { FollowUpModal } from './FollowUpModal';
import { ContactProfileModal } from './ContactProfileModal';
import { PipelineAnalyticsModal } from './PipelineAnalyticsModal';

export const KanbanBoard: React.FC = () => {
  const { setActiveTab, setActiveChat } = useUIStore();

  // Core Data State
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<CrmPipeline | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [contactTagLinks, setContactTagLinks] = useState<Array<{ contactId: string; tagId: string }>>([]);

  // UI / View State
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success' | 'warn'; text: string } | null>(null);
  const [density, setDensity] = useState<CardDensity>('comfortable');
  const [sortBy, setSortBy] = useState<CardSortOption>('lastActivity');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [filters, setFilters] = useState<BoardFilterState>(INITIAL_FILTER_STATE);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  const [viewSettings, setViewSettings] = useState<BoardViewSettings>({
    showAvatars: true,
    showPhone: true,
    showTags: true,
    showFollowUp: true,
    showLeadValue: true,
    showLastActivity: true,
  });

  // Modal Controls
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [leadModalDefaultStage, setLeadModalDefaultStage] = useState<string | undefined>(undefined);

  const [stageModalMode, setStageModalMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedStage, setSelectedStage] = useState<CrmStage | null>(null);

  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [pipelineModalMode, setPipelineModalMode] = useState<'manage' | 'create'>('manage');

  const [moveStageContact, setMoveStageContact] = useState<Contact | null>(null);
  const [followUpContact, setFollowUpContact] = useState<Contact | null>(null);
  const [profileContactId, setProfileContactId] = useState<string | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Load pipelines, stages, contacts, and tags
  const loadBoardData = useCallback(async (preferredPipelineId?: string) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [pipeList, contactList, tagList, tagLinks] = await Promise.all([
        PipelineRepository.listPipelines(false),
        db.contacts.toArray(),
        db.tags.toArray(),
        db.contactTags.toArray(),
      ]);

      setPipelines(pipeList);
      setContacts(contactList);
      setTags(tagList);
      setContactTagLinks(tagLinks);

      // Resolve selected pipeline
      let selected: CrmPipeline | undefined;
      if (preferredPipelineId) {
        selected = pipeList.find((p) => p.id === preferredPipelineId);
      }
      if (!selected && activePipeline) {
        selected = pipeList.find((p) => p.id === activePipeline.id);
      }
      if (!selected) {
        selected = pipeList.find((p) => p.isDefault) || pipeList[0];
      }

      setActivePipeline(selected || null);
    } catch (err: any) {
      console.error('Failed to load Kanban board data:', err);
      setLoadError(err.message || 'Unable to load CRM pipeline.');
    } finally {
      setIsLoading(false);
    }
  }, [activePipeline]);

  useEffect(() => {
    loadBoardData();
  }, []);

  // Listen to CRM Events
  useEffect(() => {
    const unsubStage = crmEvents.on('CONTACT_STAGE_CHANGED', () => {
      db.contacts.toArray().then(setContacts);
    });
    const unsubContact = crmEvents.on('CONTACT_UPDATED', () => {
      db.contacts.toArray().then(setContacts);
    });
    const unsubPipeline = crmEvents.on('PIPELINE_UPDATED', () => {
      PipelineRepository.listPipelines(false).then(setPipelines);
    });

    return () => {
      unsubStage();
      unsubContact();
      unsubPipeline();
    };
  }, []);

  // Show auto-dismissing toast
  const showToast = (text: string, type: 'error' | 'success' | 'warn' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  };

  // Contacts mapped to tag IDs for fast filtering
  const contactTagsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    contactTagLinks.forEach((link) => {
      if (!map.has(link.contactId)) map.set(link.contactId, new Set());
      map.get(link.contactId)!.add(link.tagId);
    });
    return map;
  }, [contactTagLinks]);

  // Filter and Sort contacts
  const filteredContacts = useMemo(() => {
    if (!activePipeline) return [];

    const query = searchQuery.trim().toLowerCase();
    const now = Date.now();
    const todayMidnight = new Date().setHours(0, 0, 0, 0);
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const stageMap = new Map(activePipeline.stages.map((s) => [s.id, s]));

    return contacts.filter((c) => {
      // 1. Pipeline Association
      const matchesPipeline = c.pipelineId === activePipeline.id || (!c.pipelineId && activePipeline.isDefault);
      if (!matchesPipeline) return false;

      // 2. Contact Status (Active vs Archived)
      if (filters.contactStatus === 'active' && c.isArchived) return false;
      if (filters.contactStatus === 'archived' && !c.isArchived) return false;

      // 3. Quick Filter Shortcuts
      if (quickFilter === 'new_leads') {
        const firstStageId = activePipeline.stages[0]?.id;
        if (c.stageId !== firstStageId) return false;
      } else if (quickFilter === 'hot_leads') {
        if (c.priority !== 'high' && c.priority !== 'urgent') return false;
      } else if (quickFilter === 'follow_up_today') {
        if (!c.nextFollowUp) return false;
        const d = new Date(c.nextFollowUp).setHours(0, 0, 0, 0);
        if (d !== todayMidnight) return false;
      } else if (quickFilter === 'overdue') {
        if (!c.nextFollowUp || c.nextFollowUp >= now) return false;
      } else if (quickFilter === 'customers') {
        const st = stageMap.get(c.stageId || '');
        if (!st?.isWon) return false;
      } else if (quickFilter === 'lost') {
        const st = stageMap.get(c.stageId || '');
        if (!st?.isLost) return false;
      }

      // 4. Search Query
      if (query) {
        const nameMatch = c.name?.toLowerCase().includes(query);
        const phoneMatch = c.phone?.includes(query) || c.id.includes(query);
        const pushNameMatch = c.pushName?.toLowerCase().includes(query);
        const companyMatch = String(c.customFields?.company || '').toLowerCase().includes(query);
        if (!nameMatch && !phoneMatch && !pushNameMatch && !companyMatch) {
          return false;
        }
      }

      // 5. Filter Drawer: Priorities
      if (filters.priorities.length > 0) {
        const p = c.priority || 'medium';
        if (!filters.priorities.includes(p)) return false;
      }

      // 6. Filter Drawer: Tags
      if (filters.tagIds.length > 0) {
        const contactTags = contactTagsMap.get(c.id);
        const hasAnyTag = filters.tagIds.some((tId) => contactTags?.has(tId));
        if (!hasAnyTag) return false;
      }

      // 7. Filter Drawer: Follow-up Status
      if (filters.followUpStatus !== 'all') {
        if (filters.followUpStatus === 'none' && c.nextFollowUp) return false;
        if (filters.followUpStatus === 'overdue' && (!c.nextFollowUp || c.nextFollowUp >= now)) return false;
        if (filters.followUpStatus === 'today') {
          if (!c.nextFollowUp) return false;
          const d = new Date(c.nextFollowUp).setHours(0, 0, 0, 0);
          if (d !== todayMidnight) return false;
        }
        if (filters.followUpStatus === 'upcoming') {
          if (!c.nextFollowUp || c.nextFollowUp <= now) return false;
        }
      }

      // 8. Filter Drawer: Date Range
      if (filters.dateRange !== 'all') {
        if (filters.dateRange === 'today' && c.createdAt < todayMidnight) return false;
        if (filters.dateRange === 'this_week' && c.createdAt < oneWeekAgo) return false;
        if (filters.dateRange === 'this_month' && c.createdAt < oneMonthAgo) return false;
      }

      return true;
    });
  }, [contacts, activePipeline, searchQuery, quickFilter, filters, contactTagsMap]);

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priorities.length > 0) count++;
    if (filters.tagIds.length > 0) count++;
    if (filters.followUpStatus !== 'all') count++;
    if (filters.contactStatus !== 'active') count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  }, [filters]);

  // Sort contacts according to board preferences
  const sortedContacts = useMemo(() => {
    const list = [...filteredContacts];
    list.sort((a, b) => {
      switch (sortBy) {
        case 'createdDate':
          return b.createdAt - a.createdAt;
        case 'followUpDate':
          if (!a.nextFollowUp && !b.nextFollowUp) return 0;
          if (!a.nextFollowUp) return 1;
          if (!b.nextFollowUp) return -1;
          return a.nextFollowUp - b.nextFollowUp;
        case 'priority': {
          const rank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (rank[b.priority || 'medium'] || 0) - (rank[a.priority || 'medium'] || 0);
        }
        case 'leadValue':
          return (Number(b.leadValue) || 0) - (Number(a.leadValue) || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'lastActivity':
        default:
          return (b.lastInteractionAt || b.updatedAt) - (a.lastInteractionAt || a.updatedAt);
      }
    });
    return list;
  }, [filteredContacts, sortBy]);

  // Group contacts by stage ID
  const contactsByStage = useMemo(() => {
    const map = new Map<string, Contact[]>();
    if (!activePipeline) return map;

    activePipeline.stages.forEach((st) => map.set(st.id, []));

    sortedContacts.forEach((c) => {
      const sId = c.stageId || activePipeline.stages[0]?.id;
      if (map.has(sId)) {
        map.get(sId)!.push(c);
      } else if (activePipeline.stages.length > 0) {
        map.get(activePipeline.stages[0].id)!.push(c);
      }
    });

    return map;
  }, [sortedContacts, activePipeline]);

  // Total metrics
  const totalPipelineValue = useMemo(() => {
    return filteredContacts.reduce((acc, c) => acc + (Number(c.leadValue) || 0), 0);
  }, [filteredContacts]);

  const wonLeadsCount = useMemo(() => {
    if (!activePipeline) return 0;
    const wonStages = new Set(activePipeline.stages.filter((s) => s.isWon).map((s) => s.id));
    return filteredContacts.filter((c) => wonStages.has(c.stageId || '')).length;
  }, [filteredContacts, activePipeline]);

  // Native Drag & Drop Handlers with Optimistic UI & Validation Rollback
  const handleDropContact = async (contactId: string, targetStageId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact || contact.stageId === targetStageId || !activePipeline) return;

    const originalStageId = contact.stageId;

    // Check WIP limits before drop
    const targetStage = activePipeline.stages.find((s) => s.id === targetStageId);
    if (targetStage?.wipLimit && targetStage.wipLimit > 0) {
      const currentInStage = (contactsByStage.get(targetStageId) || []).length;
      if (currentInStage >= targetStage.wipLimit) {
        if (targetStage.wipLimitAction === 'PREVENT') {
          showToast(
            `Cannot move to "${targetStage.name}": WIP limit of ${targetStage.wipLimit} cards reached.`,
            'error'
          );
          return;
        } else {
          showToast(`Warning: "${targetStage.name}" has reached its WIP limit.`, 'warn');
        }
      }
    }

    // 1. Optimistic UI update
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, stageId: targetStageId, stageChangedAt: Date.now() } : c))
    );

    // 2. Persist to Dexie
    try {
      await ContactRepository.moveStage(contactId, targetStageId, activePipeline.id, 'MANUAL');
      showToast(`Moved to ${targetStage?.name || 'new stage'}`);
    } catch (err: any) {
      // 3. Rollback optimistic change on error
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, stageId: originalStageId } : c))
      );
      showToast(`Unable to move contact: ${err.message || 'Validation failed'}. Previous position restored.`, 'error');
    }
  };

  // Card & Stage actions
  const handleToggleSelectContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenWhatsApp = (contact: Contact) => {
    // Check if conversation exists or navigate
    setActiveChat({
      id: contact.id,
      name: contact.name,
      unreadCount: 0,
      pinned: false,
      archived: false,
      isGroup: contact.isGroup,
    });
    setActiveTab('inbox');
  };

  const handleArchiveContact = async (contact: Contact) => {
    try {
      await ContactRepository.archive(contact.id);
      await loadBoardData();
      showToast(`Archived ${contact.name}`);
    } catch (err: any) {
      showToast(`Failed to archive contact: ${err.message}`, 'error');
    }
  };

  const handleMoveStagePosition = async (stageId: string, direction: 'left' | 'right') => {
    if (!activePipeline) return;
    const stages = [...activePipeline.stages];
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return;

    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return;

    // Swap positions
    const [moved] = stages.splice(idx, 1);
    stages.splice(targetIdx, 0, moved);

    const reorderedIds = stages.map((s) => s.id);
    await PipelineRepository.reorderStages(activePipeline.id, reorderedIds);
    await loadBoardData(activePipeline.id);
  };

  // Bulk operations
  const handleBulkMoveStage = async (targetStageId: string) => {
    if (!activePipeline) return;
    const ids = Array.from(selectedContactIds);
    const res = await ContactRepository.bulkMoveStage(ids, targetStageId, activePipeline.id, 'MANUAL');

    if (res.failed.length === 0) {
      showToast(`Moved ${res.succeeded.length} leads successfully.`);
    } else {
      showToast(`${res.succeeded.length} moved successfully, ${res.failed.length} failed.`, 'warn');
    }

    setSelectedContactIds(new Set());
    await loadBoardData();
  };

  const handleBulkAddTag = async (tagId: string) => {
    for (const id of selectedContactIds) {
      await ContactRepository.assignTag(id, tagId);
    }
    showToast(`Tagged ${selectedContactIds.size} contacts.`);
    setSelectedContactIds(new Set());
    await loadBoardData();
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Archive ${selectedContactIds.size} selected leads?`)) return;
    for (const id of selectedContactIds) {
      await ContactRepository.archive(id);
    }
    showToast(`Archived ${selectedContactIds.size} leads.`);
    setSelectedContactIds(new Set());
    await loadBoardData();
  };

  const handleBulkExportCSV = () => {
    const selectedList = contacts.filter((c) => selectedContactIds.has(c.id));
    const csv = CRMDataTransfer.exportToCSV(selectedList);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openmsg_leads_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selectedList.length} leads to CSV.`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
            toastMessage.type === 'error'
              ? 'bg-rose-500/90 text-white border border-rose-400'
              : toastMessage.type === 'warn'
              ? 'bg-amber-500/90 text-zinc-950 border border-amber-400'
              : 'bg-emerald-600/90 text-white border border-emerald-400'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-1 opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Kanban Header */}
      <KanbanHeader
        pipelines={pipelines}
        activePipeline={activePipeline}
        onSelectPipeline={(pId) => loadBoardData(pId)}
        onCreatePipeline={() => {
          setPipelineModalMode('create');
          setIsPipelineModalOpen(true);
        }}
        onManagePipelines={() => {
          setPipelineModalMode('manage');
          setIsPipelineModalOpen(true);
        }}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilterCount={activeFilterCount}
        onToggleFilterDrawer={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
        quickFilter={quickFilter}
        onSelectQuickFilter={setQuickFilter}
        density={density}
        onChangeDensity={setDensity}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        viewSettings={viewSettings}
        onToggleViewSetting={(key) =>
          setViewSettings((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onAddNewLead={() => {
          setEditingContact(null);
          setLeadModalDefaultStage(activePipeline?.stages[0]?.id);
          setIsLeadModalOpen(true);
        }}
        totalLeadsCount={filteredContacts.length}
        totalPipelineValue={totalPipelineValue}
        wonLeadsCount={wonLeadsCount}
        currency={filteredContacts[0]?.leadCurrency || 'INR'}
      />

      {/* Main Board Viewport */}
      {isLoading ? (
        /* Loading Skeletons */
        <div className="flex-1 p-4 flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-80 min-w-[280px] bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-4 flex flex-col gap-3 animate-pulse shrink-0"
            >
              <div className="h-6 bg-zinc-800 rounded-lg w-2/3" />
              <div className="h-24 bg-zinc-800/50 rounded-xl" />
              <div className="h-24 bg-zinc-800/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        /* Error State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <h3 className="text-sm font-bold text-zinc-100">{loadError}</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Unable to initialize CRM pipeline from local IndexedDB storage.
          </p>
          <button
            onClick={() => loadBoardData()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : !activePipeline || activePipeline.stages.length === 0 ? (
        /* Empty Board State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <Layers className="h-12 w-12 text-zinc-700" />
          <h3 className="text-base font-bold text-zinc-100">No stages configured</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            This pipeline currently has no stages. Add your first stage to start organizing leads visually.
          </p>
          <button
            onClick={() => {
              setSelectedStage(null);
              setStageModalMode('create');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="h-4 w-4" />
            Add Stage
          </button>
        </div>
      ) : filteredContacts.length === 0 && contacts.length > 0 ? (
        /* Filtered Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <FilterX className="h-10 w-10 text-zinc-600" />
          <h3 className="text-sm font-bold text-zinc-200">No leads match your current filters</h3>
          <p className="text-xs text-zinc-400">Try adjusting your search keywords or resetting filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setQuickFilter('all');
              setFilters(INITIAL_FILTER_STATE);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Kanban Columns Container with Smooth Horizontal Scroll */
        <div className="flex-1 p-4 flex gap-4 overflow-x-auto overflow-y-hidden">
          {activePipeline.stages.map((stage) => {
            const stageContacts = contactsByStage.get(stage.id) || [];
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                stages={activePipeline.stages}
                contacts={stageContacts}
                tags={tags}
                density={density}
                viewSettings={viewSettings}
                selectedContactIds={selectedContactIds}
                onToggleSelectContact={handleToggleSelectContact}
                onOpenProfile={(c) => setProfileContactId(c.id)}
                onOpenWhatsApp={handleOpenWhatsApp}
                onMoveToStage={(c) => setMoveStageContact(c)}
                onFollowUp={(c) => setFollowUpContact(c)}
                onAddNote={(c) => {
                  setProfileContactId(c.id);
                }}
                onEditContact={(c) => {
                  setEditingContact(c);
                  setIsLeadModalOpen(true);
                }}
                onArchiveContact={handleArchiveContact}
                onAddLeadToStage={(stageId) => {
                  setEditingContact(null);
                  setLeadModalDefaultStage(stageId);
                  setIsLeadModalOpen(true);
                }}
                onEditStage={(st) => {
                  setSelectedStage(st);
                  setStageModalMode('edit');
                }}
                onDeleteStage={(st) => {
                  setSelectedStage(st);
                  setStageModalMode('delete');
                }}
                onMoveStagePosition={handleMoveStagePosition}
                onDropContact={handleDropContact}
              />
            );
          })}

          {/* Quick "+ Add Stage" Column at End */}
          <div className="w-48 min-w-[180px] flex flex-col justify-start shrink-0 pt-1">
            <button
              onClick={() => {
                setSelectedStage(null);
                setStageModalMode('create');
              }}
              className="w-full py-4 px-3 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              Add Stage
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <KanbanBulkBar
        selectedCount={selectedContactIds.size}
        stages={activePipeline?.stages || []}
        tags={tags}
        onClearSelection={() => setSelectedContactIds(new Set())}
        onBulkMoveStage={handleBulkMoveStage}
        onBulkAddTag={handleBulkAddTag}
        onBulkArchive={handleBulkArchive}
        onBulkExportCSV={handleBulkExportCSV}
        onBulkCreateFollowUp={() => {
          const firstSelected = contacts.find((c) => selectedContactIds.has(c.id));
          if (firstSelected) setFollowUpContact(firstSelected);
        }}
      />

      {/* Modals */}
      {/* 1. Add / Edit Lead Modal */}
      {activePipeline && (
        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          onSaved={() => loadBoardData()}
          contact={editingContact}
          pipeline={activePipeline}
          defaultStageId={leadModalDefaultStage}
          allTags={tags}
        />
      )}

      {/* 2. Stage Settings & Safe Deletion Modal */}
      {activePipeline && stageModalMode && (
        <StageModal
          isOpen={true}
          onClose={() => setStageModalMode(null)}
          onSaved={() => loadBoardData(activePipeline.id)}
          pipeline={activePipeline}
          stage={selectedStage}
          mode={stageModalMode}
        />
      )}

      {/* 3. Pipeline Settings Modal */}
      <PipelineModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        onUpdated={(pId) => loadBoardData(pId)}
        initialMode={pipelineModalMode}
      />

      {/* 4. Keyboard / Menu Accessible Move Stage Modal */}
      {activePipeline && (
        <MoveStageModal
          contact={moveStageContact}
          pipeline={activePipeline}
          isOpen={Boolean(moveStageContact)}
          onClose={() => setMoveStageContact(null)}
          onMoved={() => loadBoardData()}
        />
      )}

      {/* 5. Follow-Up Scheduling Modal */}
      <FollowUpModal
        contact={followUpContact}
        isOpen={Boolean(followUpContact)}
        onClose={() => setFollowUpContact(null)}
        onUpdated={() => loadBoardData()}
      />

      {/* 6. Contact Full Profile Drawer / Modal */}
      {activePipeline && (
        <ContactProfileModal
          contactId={profileContactId}
          pipeline={activePipeline}
          isOpen={Boolean(profileContactId)}
          onClose={() => setProfileContactId(null)}
          onOpenWhatsApp={handleOpenWhatsApp}
          onFollowUp={(c) => setFollowUpContact(c)}
          onEditContact={(c) => {
            setProfileContactId(null);
            setEditingContact(c);
            setIsLeadModalOpen(true);
          }}
          onUpdated={() => loadBoardData()}
        />
      )}

      {/* 7. Pipeline Analytics Modal */}
      {activePipeline && (
        <PipelineAnalyticsModal
          pipeline={activePipeline}
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}

      {/* 8. Filter Drawer */}
      <KanbanFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onResetFilters={() => setFilters(INITIAL_FILTER_STATE)}
        allTags={tags}
      />
    </div>
  );
};

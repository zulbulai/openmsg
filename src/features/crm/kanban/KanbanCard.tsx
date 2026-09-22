/**
 * OpenMsg Kanban Contact Card
 * Visual CRM card displaying contact details, tags, priority, follow-up, value, and quick actions.
 */

import React, { useState } from 'react';
import {
  MoreVertical,
  MessageSquare,
  Clock,
  Tag as TagIcon,
  Calendar,
  Building,
  ArrowRight,
  User,
  CheckSquare,
  Square,
  AlertCircle,
  Archive,
  FileText,
} from 'lucide-react';
import { Contact, Tag, CrmStage } from '@/storage/schemas';

export type CardDensity = 'compact' | 'comfortable' | 'expanded';

export interface BoardViewSettings {
  showAvatars: boolean;
  showPhone: boolean;
  showTags: boolean;
  showFollowUp: boolean;
  showLeadValue: boolean;
  showLastActivity: boolean;
}

interface KanbanCardProps {
  contact: Contact;
  stages: CrmStage[];
  tags: Tag[];
  density: CardDensity;
  viewSettings: BoardViewSettings;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenProfile: (contact: Contact) => void;
  onOpenWhatsApp: (contact: Contact) => void;
  onMoveToStage: (contact: Contact) => void;
  onFollowUp: (contact: Contact) => void;
  onAddNote: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onArchive: (contact: Contact) => void;
  onDragStart: (e: React.DragEvent, contactId: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  contact,
  tags,
  density,
  viewSettings,
  isSelected,
  onToggleSelect,
  onOpenProfile,
  onOpenWhatsApp,
  onMoveToStage,
  onFollowUp,
  onAddNote,
  onEdit,
  onArchive,
  onDragStart,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Format currency
  const formatCurrency = (val?: number, currency = 'INR') => {
    if (val === undefined || isNaN(val)) return null;
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 0,
      }).format(val);
    } catch {
      return `${currency} ${val.toLocaleString()}`;
    }
  };

  // Follow-up status
  const getFollowUpStatus = (timestamp?: number) => {
    if (!timestamp) return null;
    const now = Date.now();
    const diff = timestamp - now;
    const isOverdue = diff < 0;

    const date = new Date(timestamp);
    const isToday = date.toDateString() === new Date().toDateString();

    let text = '';
    if (isOverdue) {
      text = 'Overdue';
    } else if (isToday) {
      text = `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      text = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    return { text, isOverdue };
  };

  const followUpStatus = getFollowUpStatus(contact.nextFollowUp);

  // Priority color badge
  const renderPriorityBadge = (priority?: Contact['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            High
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Low
          </span>
        );
      case 'medium':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            Med
          </span>
        );
    }
  };

  // Company from customFields
  const company = (contact.customFields?.company as string) || '';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, contact.id)}
      className={`group relative rounded-xl border transition-all duration-150 bg-zinc-900/90 hover:bg-zinc-900 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing select-none ${
        isSelected
          ? 'border-emerald-500/80 ring-1 ring-emerald-500/30 bg-emerald-950/20'
          : 'border-zinc-800/80 hover:border-zinc-700'
      } ${density === 'compact' ? 'p-2.5' : density === 'expanded' ? 'p-3.5' : 'p-3'}`}
    >
      {/* Top Card Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Multi-select Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(contact.id);
            }}
            className="text-zinc-500 hover:text-emerald-400 transition shrink-0"
            title={isSelected ? 'Deselect lead' : 'Select lead'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-emerald-400" />
            ) : (
              <Square className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
            )}
          </button>

          {/* Avatar */}
          {viewSettings.showAvatars && density !== 'compact' && (
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
              {contact.name ? contact.name.substring(0, 2).toUpperCase() : <User className="h-3.5 w-3.5" />}
            </div>
          )}

          {/* Name & Company */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpenProfile(contact)}>
            <div className="font-semibold text-xs text-zinc-100 truncate hover:text-emerald-400 transition flex items-center gap-1">
              <span>{contact.name || 'Unnamed Contact'}</span>
              {contact.pushName && density === 'expanded' && (
                <span className="text-[10px] text-zinc-500 font-normal">~{contact.pushName}</span>
              )}
            </div>

            {company && density !== 'compact' && (
              <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                <Building className="h-2.5 w-2.5 shrink-0 text-zinc-500" />
                <span>{company}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Menu Trigger */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            title="More actions"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {/* Action Menu Dropdown */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-40 w-44 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl p-1 flex flex-col gap-0.5 text-xs">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfile(contact);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  View Profile
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenWhatsApp(contact);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                  Open WhatsApp
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onMoveToStage(contact);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                  Move to Stage...
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onFollowUp(contact);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  Schedule Follow-up
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAddNote(contact);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5 text-purple-400" />
                  Add Note
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(contact);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <TagIcon className="h-3.5 w-3.5 text-zinc-400" />
                  Edit Details
                </button>

                <div className="h-px bg-zinc-800 my-1" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive(contact);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 flex items-center gap-2"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive Lead
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Phone Number */}
      {viewSettings.showPhone && (
        <div className="text-[11px] font-mono text-zinc-400 mt-1 pl-6">
          {contact.phone || contact.id.replace('@c.us', '')}
        </div>
      )}

      {/* Tags Chips */}
      {viewSettings.showTags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pl-6">
          {tags.slice(0, density === 'compact' ? 2 : 4).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium border"
              style={{
                backgroundColor: `${tag.color || '#10b981'}15`,
                borderColor: `${tag.color || '#10b981'}30`,
                color: tag.color || '#10b981',
              }}
            >
              {tag.name}
            </span>
          ))}
          {tags.length > (density === 'compact' ? 2 : 4) && (
            <span className="text-[10px] text-zinc-500 font-mono">
              +{tags.length - (density === 'compact' ? 2 : 4)}
            </span>
          )}
        </div>
      )}

      {/* Badges & Value Row */}
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-zinc-800/60 pl-6 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {renderPriorityBadge(contact.priority)}

          {/* Follow-up status badge */}
          {viewSettings.showFollowUp && followUpStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFollowUp(contact);
              }}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition ${
                followUpStatus.isOverdue
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-amber-500/40'
              }`}
              title="Click to view/reschedule follow-up"
            >
              {followUpStatus.isOverdue ? (
                <AlertCircle className="h-2.5 w-2.5 text-rose-400" />
              ) : (
                <Clock className="h-2.5 w-2.5 text-amber-400" />
              )}
              <span>{followUpStatus.text}</span>
            </button>
          )}
        </div>

        {/* Lead Value */}
        {viewSettings.showLeadValue && contact.leadValue !== undefined && contact.leadValue > 0 && (
          <span className="text-xs font-bold font-mono text-emerald-400 shrink-0">
            {formatCurrency(contact.leadValue, contact.leadCurrency)}
          </span>
        )}
      </div>

      {/* Quick Action Footer in Expanded View */}
      {density === 'expanded' && (
        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 pl-6">
          <span className="text-[10px] text-zinc-500">
            {contact.lastInteractionAt
              ? `Active ${new Date(contact.lastInteractionAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}`
              : 'No interaction'}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenWhatsApp(contact);
            }}
            className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1 transition"
          >
            <MessageSquare className="h-3 w-3" />
            WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};

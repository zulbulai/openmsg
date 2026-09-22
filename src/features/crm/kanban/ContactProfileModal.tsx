/**
 * OpenMsg Contact Profile Modal
 * Comprehensive CRM contact profile view with stage switcher, stage history timeline, notes, and follow-ups.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Building,
  Mail,
  Calendar,
  MessageSquare,
  Send,
  Edit2,
  Route,
} from 'lucide-react';
import { Contact, CrmPipeline, Tag, Note } from '@/storage/schemas';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';
import { ContactTimeline } from '../ContactTimeline';
import { SequenceEnrollmentModal } from '@/features/sequences/SequenceEnrollmentModal';

interface ContactProfileModalProps {
  contactId: string | null;
  pipeline: CrmPipeline;
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsApp: (contact: Contact) => void;
  onFollowUp: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onUpdated: () => void;
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  contactId,
  pipeline,
  isOpen,
  onClose,
  onOpenWhatsApp,
  onFollowUp,
  onEditContact,
  onUpdated,
}) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactTags, setContactTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'details'>('timeline');
  const [isChangingStage, setIsChangingStage] = useState(false);
  const [newTagId, setNewTagId] = useState('');
  const [showSequenceModal, setShowSequenceModal] = useState(false);

  const loadData = async () => {
    if (!contactId) return;
    const c = await ContactRepository.getById(contactId);
    setContact(c || null);

    const [tags, cTags, nList] = await Promise.all([
      db.tags.toArray(),
      ContactRepository.getTags(contactId),
      ContactRepository.getNotes(contactId),
    ]);

    setAllTags(tags);
    setContactTags(cTags);
    setNotes(nList);
  };

  useEffect(() => {
    if (isOpen && contactId) {
      loadData();
      setActiveTab('timeline');
    }
  }, [isOpen, contactId]);

  if (!isOpen || !contact) return null;

  const handleStageChange = async (newStageId: string) => {
    if (!contact || newStageId === contact.stageId) return;
    setIsChangingStage(true);
    try {
      const updated = await ContactRepository.moveStage(contact.id, newStageId, pipeline.id, 'MANUAL');
      setContact(updated);
      onUpdated();
      await loadData();
    } catch (err: any) {
      alert(`Failed to change stage: ${err.message || String(err)}`);
    } finally {
      setIsChangingStage(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !contact) return;
    await ContactRepository.addNote(contact.id, newNote.trim());
    setNewNote('');
    await loadData();
    onUpdated();
  };

  const handleAddTag = async () => {
    if (!newTagId || !contact) return;
    await ContactRepository.assignTag(contact.id, newTagId);
    setNewTagId('');
    await loadData();
    onUpdated();
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!contact) return;
    await ContactRepository.removeTag(contact.id, tagId);
    await loadData();
    onUpdated();
  };

  const formatCurrency = (val?: number, currency = 'INR') => {
    if (val === undefined || isNaN(val)) return null;
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

  const company = (contact.customFields?.company as string) || '';
  const email = (contact.customFields?.email as string) || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] text-xs">
        {/* Header Profile Bar */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/90 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-base flex items-center justify-center shrink-0">
              {contact.name ? contact.name.substring(0, 2).toUpperCase() : <User className="h-6 w-6" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-zinc-100 truncate">{contact.name}</h2>
                <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-zinc-800 text-zinc-300 border-zinc-700">
                  {contact.priority || 'medium'} priority
                </span>
                {contact.leadValue !== undefined && contact.leadValue > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {formatCurrency(contact.leadValue, contact.leadCurrency)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-zinc-400 text-xs mt-1 flex-wrap">
                <span className="font-mono flex items-center gap-1">
                  <Phone className="h-3 w-3 text-zinc-500" />
                  {contact.phone || contact.id}
                </span>

                {company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3 text-zinc-500" />
                    {company}
                  </span>
                )}

                {email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-zinc-500" />
                    {email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onEditContact(contact)}
              className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
              title="Edit details"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stage & Action Controls Strip */}
        <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Stage Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-semibold">CRM Stage:</span>
            <select
              value={contact.stageId || pipeline.stages[0]?.id}
              disabled={isChangingStage}
              onChange={(e) => handleStageChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
            >
              {pipeline.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenWhatsApp(contact);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </button>

            <button
              onClick={() => onFollowUp(contact)}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium flex items-center gap-1.5 transition"
            >
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              Follow-up
            </button>

            <button
              onClick={() => setShowSequenceModal(true)}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium flex items-center gap-1.5 transition"
            >
              <Route className="h-3.5 w-3.5 text-emerald-400" />
              Sequences
            </button>
          </div>
        </div>

        {/* Tags Row */}
        <div className="px-5 py-2.5 border-b border-zinc-800/80 bg-zinc-950/20 flex flex-wrap items-center gap-2">
          <span className="text-zinc-500 font-semibold">Tags:</span>
          {contactTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
              style={{
                backgroundColor: `${tag.color || '#10b981'}15`,
                borderColor: `${tag.color || '#10b981'}30`,
                color: tag.color || '#10b981',
              }}
            >
              {tag.name}
              <button onClick={() => handleRemoveTag(tag.id)} className="hover:opacity-70">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {/* Add Tag Dropdown */}
          <div className="flex items-center gap-1 ml-auto">
            <select
              value={newTagId}
              onChange={(e) => setNewTagId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-[11px]"
            >
              <option value="">+ Assign Tag</option>
              {allTags
                .filter((t) => !contactTags.some((ct) => ct.id === t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            {newTagId && (
              <button
                onClick={handleAddTag}
                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-zinc-800 flex gap-4 text-xs font-semibold bg-zinc-900/40">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'timeline'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Activity &amp; Stage History
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'notes'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'details'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Custom Fields &amp; Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Tab 1: Timeline & Stage History */}
          {activeTab === 'timeline' && <ContactTimeline contactId={contact.id} />}

          {/* Tab 2: Notes */}
          {activeTab === 'notes' && (
            <div className="flex flex-col gap-4">
              <form onSubmit={handleAddNote} className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record call summary, meeting notes, action items..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="self-end px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Save Note
                </button>
              </form>

              <div className="flex flex-col gap-2 mt-2">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">No notes recorded yet.</div>
                ) : (
                  notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1.5"
                    >
                      <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                      <span className="text-[10px] text-zinc-500 self-end">
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Details & Custom Fields */}
          {activeTab === 'details' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2.5">
                <h4 className="font-bold text-zinc-200 mb-1">Contact Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Record ID:</span>
                    <span className="font-mono text-zinc-300">{contact.id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Created Date:</span>
                    <span className="text-zinc-300">{new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Stage Changed:</span>
                    <span className="text-zinc-300">
                      {contact.stageChangedAt
                        ? new Date(contact.stageChangedAt).toLocaleString()
                        : 'Initial creation'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Last Active:</span>
                    <span className="text-zinc-300">
                      {contact.lastInteractionAt
                        ? new Date(contact.lastInteractionAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
                <h4 className="font-bold text-zinc-200 mb-1">Custom CRM Fields</h4>
                {Object.keys(contact.customFields || {}).length === 0 ? (
                  <span className="text-zinc-500 italic">No custom fields defined.</span>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(contact.customFields).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                          {k}
                        </span>
                        <span className="text-zinc-200 font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showSequenceModal && (
        <SequenceEnrollmentModal
          contactId={contact.id}
          onClose={() => setShowSequenceModal(false)}
        />
      )}
    </div>
  );
};

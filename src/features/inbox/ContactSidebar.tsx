import React, { useState, useEffect } from 'react';
import {
  Tag as TagIcon,
  FileEdit,
  Plus,
  X,
  Play,
  Route,
  Bell,
} from 'lucide-react';
import { Contact, Tag, Note, FollowUp } from '@/storage/schemas';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { db } from '@/storage/db';
import { SequenceEnrollmentModal } from '@/features/sequences/SequenceEnrollmentModal';
import { FollowUpModal } from '@/features/crm/followups/FollowUpModal';

interface ContactSidebarProps {
  contactId: string;
  onClose: () => void;
  onStartWorkflow?: (contactId: string) => void;
}

export const ContactSidebar: React.FC<ContactSidebarProps> = ({
  contactId,
  onClose,
  onStartWorkflow,
}) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [contactTags, setContactTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const loadData = async () => {
    const [c, tags, cTags, n, fu] = await Promise.all([
      ContactRepository.getById(contactId),
      db.tags.toArray(),
      ContactRepository.getTags(contactId),
      ContactRepository.getNotes(contactId),
      FollowUpRepository.getByContactId(contactId),
    ]);
    setContact(c || null);
    setAllTags(tags);
    setContactTags(cTags);
    setNotes(n);
    setFollowUps(fu);
  };

  useEffect(() => {
    loadData();
  }, [contactId]);

  const handleAddTag = async () => {
    if (!selectedTagId) return;
    await ContactRepository.addTag(contactId, selectedTagId);
    setSelectedTagId('');
    await loadData();
  };

  const handleRemoveTag = async (tagId: string) => {
    await ContactRepository.removeTag(contactId, tagId);
    await loadData();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await ContactRepository.addNote(contactId, newNote.trim());
    setNewNote('');
    await loadData();
  };

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-900/50 flex flex-col h-full overflow-y-auto">
      {/* Sidebar Header */}
      <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/80">
        <h3 className="text-xs font-bold text-zinc-100">Contact Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-3 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base mb-2">
            {(contact?.name || contactId).substring(0, 2).toUpperCase()}
          </div>
          <h4 className="text-sm font-semibold text-zinc-100">{contact?.name || 'Unknown Contact'}</h4>
          <span className="text-xs text-zinc-400 font-mono mt-0.5">{contact?.phone || contactId}</span>
          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 mt-2">
            {contact?.isGroup ? 'Group Conversation' : 'Direct Contact'}
          </span>

          {onStartWorkflow && (
            <button
              onClick={() => onStartWorkflow(contactId)}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Play className="h-3.5 w-3.5" />
              Trigger Workflow
            </button>
          )}

          <button
            onClick={() => setShowSequenceModal(true)}
            className="mt-2 w-full py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Route className="h-3.5 w-3.5 text-zinc-400" />
            Manage Sequences
          </button>

          <button
            onClick={() => setShowFollowUpModal(true)}
            className="mt-2 w-full py-1.5 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Bell className="h-3.5 w-3.5" />
            + Follow-up / Reminder
          </button>
        </div>

        {/* Tags Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5 text-emerald-400" />
              Tags
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-6">
            {contactTags.length === 0 ? (
              <span className="text-[11px] text-zinc-500">No tags assigned</span>
            ) : (
              contactTags.map((tag) => (
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
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="hover:opacity-70"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Tag Row */}
          <div className="flex gap-1.5 mt-1">
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700/60 rounded px-2 py-1 text-xs text-zinc-200"
            >
              <option value="">Select a tag...</option>
              {allTags
                .filter((t) => !contactTags.some((ct) => ct.id === t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAddTag}
              disabled={!selectedTagId}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs text-zinc-200 rounded flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Assign
            </button>
          </div>
        </div>

        {/* Custom Fields Section */}
        {contact?.customFields && Object.keys(contact.customFields).length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-200">Custom Fields</span>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex flex-col gap-1.5 text-xs">
              {Object.entries(contact.customFields).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-0.5 border-b border-zinc-800/40 last:border-0">
                  <span className="text-zinc-400 capitalize">{key}:</span>
                  <span className="text-zinc-200 font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-ups Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-blue-400" />
              Follow-ups ({followUps.length})
            </span>
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {followUps.length === 0 ? (
              <span className="text-[11px] text-zinc-500 italic">No follow-ups scheduled</span>
            ) : (
              followUps.map((fu) => {
                const status = FollowUpRepository.computeStatus(fu);
                const isOverdue = status === 'OVERDUE';
                const isCompleted = status === 'COMPLETED';

                return (
                  <div
                    key={fu.id}
                    className={`p-2 rounded-lg border text-xs flex flex-col gap-1 ${
                      isCompleted
                        ? 'bg-zinc-900/40 border-zinc-800/40 opacity-70'
                        : isOverdue
                        ? 'bg-red-950/20 border-red-900/50'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold truncate ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {fu.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {new Date(fu.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {fu.description && (
                      <p className="text-[10px] text-zinc-400 line-clamp-1">{fu.description}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
            <span className="flex items-center gap-1.5">
              <FileEdit className="h-3.5 w-3.5 text-emerald-400" />
              CRM Notes ({notes.length})
            </span>
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="flex flex-col gap-1.5">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note..."
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="self-end px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium text-zinc-200 rounded"
            >
              Save Note
            </button>
          </form>

          {/* Notes List */}
          <div className="flex flex-col gap-2 mt-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs flex flex-col gap-1"
              >
                <p className="text-zinc-200 whitespace-pre-wrap">{note.content}</p>
                <span className="text-[10px] text-zinc-500 self-end">
                  {new Date(note.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showSequenceModal && (
        <SequenceEnrollmentModal
          contactId={contactId}
          onClose={() => setShowSequenceModal(false)}
        />
      )}

      {showFollowUpModal && (
        <FollowUpModal
          isOpen={true}
          onClose={() => setShowFollowUpModal(false)}
          onSaved={() => {
            setShowFollowUpModal(false);
            loadData();
          }}
          preselectedContactId={contactId}
          source="INBOX"
        />
      )}
    </div>
  );
};

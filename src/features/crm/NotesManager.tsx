import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Search,
  User,
  Calendar,
  Save,
  X,
} from 'lucide-react';
import { Note, Contact } from '@/storage/schemas';
import { db } from '@/storage/db';

export const NotesManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [contactsMap, setContactsMap] = useState<Map<string, Contact>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New/Edit Note Dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allNotes, allContacts] = await Promise.all([
        db.notes.reverse().toArray(),
        db.contacts.toArray(),
      ]);

      setNotes(allNotes);
      const cMap = new Map<string, Contact>();
      allContacts.forEach((c) => cMap.set(c.id, c));
      setContactsMap(cMap);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId.trim() || !content.trim()) return;

    try {
      const noteItem: Note = {
        id: editingNote?.id || `note_${Date.now()}`,
        contactId: selectedContactId.trim(),
        content: content.trim(),
        createdAt: editingNote?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await db.notes.put(noteItem);
      setIsModalOpen(false);
      setEditingNote(null);
      setContent('');
      loadData();
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internal note?')) return;
    await db.notes.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const contact = contactsMap.get(n.contactId);
    const contactName = contact?.name?.toLowerCase() || '';
    const contactPhone = contact?.phone || '';
    return (
      n.content.toLowerCase().includes(q) ||
      contactName.includes(q) ||
      contactPhone.includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-400" />
            CRM Internal Notes
          </h1>
          <p className="text-xs text-zinc-400">
            Private, local-first customer interaction notes and call memos. Never sent to WhatsApp.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingNote(null);
            setSelectedContactId(Array.from(contactsMap.keys())[0] || '');
            setContent('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-amber-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes by keyword or contact..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No Internal Notes Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Add private notes to contacts to keep track of preferences, meeting outcomes, and deal stages.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const contact = contactsMap.get(note.contactId);

            return (
              <div
                key={note.id}
                className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-200">
                      {contact ? contact.name || contact.phone : note.contactId}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({contact?.phone || note.contactId})
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 whitespace-pre-wrap font-sans bg-zinc-950/60 p-3 rounded-xl border border-zinc-850">
                    {note.content}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(note.updatedAt || note.createdAt).toLocaleString()}</span>
                    </span>
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <span className="italic">(edited)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingNote(note);
                      setSelectedContactId(note.contactId);
                      setContent(note.content);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-750 transition"
                    title="Edit Note"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition"
                    title="Delete Note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Note Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <span>{editingNote ? 'Edit Internal Note' : 'New Internal Note'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Contact</label>
                <select
                  required
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  {Array.from(contactsMap.values()).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.phone} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Note Content</label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type internal notes about this customer..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  Trash2,
  Tag as TagIcon,
  Edit2,
  CheckSquare,
  Square,
  KanbanSquare,
  Table as TableIcon,
} from 'lucide-react';
import { Contact } from '@/storage/schemas';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';
import { ContactModal } from './ContactModal';
import { TagManager } from './TagManager';
import { CRMDataTransfer } from '@/core/crm/import-export';
import { KanbanBoard } from './kanban/KanbanBoard';

interface ContactManagerProps {
  initialViewMode?: 'kanban' | 'table';
}

export const ContactManager: React.FC<ContactManagerProps> = ({ initialViewMode = 'kanban' }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(initialViewMode);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const liveContacts = useLiveQuery(() => db.contacts.toArray());
  const contacts = liveContacts || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  // Modals state
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    // live query handles reactive updates automatically
  };

  // Filtered contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery) ||
      c.id.includes(searchQuery);

    const matchesStage = selectedStage === 'all' || c.stageId === selectedStage;
    return matchesSearch && matchesStage;
  });

  const toggleSelectAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedContactIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedContactIds(next);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedContactIds.size} selected contacts?`)) {
      for (const id of selectedContactIds) {
        await ContactRepository.delete(id);
      }
      setSelectedContactIds(new Set());
      await loadData();
    }
  };

  const handleExportJSON = () => {
    const data = CRMDataTransfer.exportToJSON(contacts);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openmsg_contacts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const data = CRMDataTransfer.exportToCSV(contacts);
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openmsg_contacts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      if (file.name.endsWith('.json')) {
        const res = await CRMDataTransfer.importFromJSON(text);
        alert(`Imported ${res.imported} contacts (${res.failed} failed).`);
      } else {
        const res = await CRMDataTransfer.importFromCSV(text);
        alert(`Imported ${res.imported} contacts (${res.failed} failed).`);
      }
      await loadData();
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    }
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Top View Mode Navigation Strip */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            CRM
          </span>
          <span className="text-zinc-700">/</span>
          <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'kanban'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Contacts Table
            </button>
          </div>
        </div>

        {viewMode === 'table' && (
          <span className="text-xs text-zinc-500 font-mono">
            {contacts.length} Total Contacts
          </span>
        )}
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard />
      ) : (
        <>
          {/* Top Header */}
          <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-900/40 backdrop-blur shrink-0">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-zinc-100">CRM Contacts Hub</h2>
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono ml-2">
                {contacts.length} Total
              </span>
            </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsTagManagerOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
          >
            <TagIcon className="h-3.5 w-3.5 text-emerald-400" />
            Tags
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
          >
            <Upload className="h-3.5 w-3.5 text-sky-400" />
            Import
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            JSON
          </button>

          <button
            onClick={() => {
              setEditingContact(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            New Contact
          </button>
        </div>
      </div>

      {/* Filter and Bulk Bar */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg pl-8 pr-3 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Stages</option>
            <option value="lead">Lead</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="customer">Customer</option>
            <option value="churned">Churned</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedContactIds.size > 0 && (
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700">
            <span className="text-zinc-300 font-semibold">
              {selectedContactIds.size} Selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="p-1 hover:bg-zinc-700 text-rose-400 rounded transition"
              title="Delete Selected"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            No contacts found matching your criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-medium bg-zinc-900/40 sticky top-0">
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-0.5">
                    {selectedContactIds.size === filteredContacts.length ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-500" />
                    )}
                  </button>
                </th>
                <th className="p-3">Contact</th>
                <th className="p-3">Phone / WhatsApp</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Last Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredContacts.map((c) => {
                const isSelected = selectedContactIds.has(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-zinc-900/50 transition ${
                      isSelected ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button onClick={() => toggleSelectOne(c.id)} className="p-0.5">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-500" />
                        )}
                      </button>
                    </td>

                    <td className="p-3 font-semibold text-zinc-200">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{c.name}</div>
                          {c.pushName && (
                            <span className="text-[10px] text-zinc-500">~{c.pushName}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-zinc-400 font-mono">
                      {c.phone || c.id.replace('@c.us', '')}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                        {c.stageId || 'lead'}
                      </span>
                    </td>

                    <td className="p-3 text-zinc-500 text-[11px]">
                      {c.lastInteractionAt ? (
                        new Date(c.lastInteractionAt).toLocaleDateString()
                      ) : (
                        <span className="text-zinc-600">Never</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setEditingContact(c);
                          setIsModalOpen(true);
                        }}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 mr-1"
                        title="Edit Contact"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete ${c.name}?`)) {
                            await ContactRepository.delete(c.id);
                            await loadData();
                          }
                        }}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400"
                        title="Delete Contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Contact Create / Edit Modal */}
      <ContactModal
        contact={editingContact}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
      />

      {/* Tag Manager Drawer Modal */}
      {isTagManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-96 bg-zinc-950 border-l border-zinc-800 h-full shadow-2xl">
            <TagManager onClose={() => setIsTagManagerOpen(false)} />
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

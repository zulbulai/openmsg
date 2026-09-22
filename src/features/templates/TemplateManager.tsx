import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Search,
  X,
  Save,
} from 'lucide-react';
import { MessageTemplate } from '@/storage/schemas';
import { db } from '@/storage/db';
import { SafeTemplate } from '@/core/template/safe-template';

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');

  const loadTemplates = async () => {
    const list = await db.templates.toArray();
    setTemplates(list);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setTitle('');
    setCategory('General');
    setContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setTitle(t.title);
    setCategory(t.category);
    setContent(t.content);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const vars = SafeTemplate.extractVariables(content);

    const record: MessageTemplate = {
      id: editingTemplate?.id || `tpl_${Date.now()}`,
      title: title.trim(),
      category: category.trim() || 'General',
      content: content.trim(),
      variables: vars,
    };

    await db.templates.put(record);
    setIsModalOpen(false);
    await loadTemplates();
  };

  const handleDuplicate = async (t: MessageTemplate) => {
    const dup: MessageTemplate = {
      ...t,
      id: `tpl_${Date.now()}`,
      title: `${t.title} (Copy)`,
    };
    await db.templates.put(dup);
    await loadTemplates();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) {
      await db.templates.delete(id);
      await loadTemplates();
    }
  };

  const sampleContact = {
    name: 'Emily Davis',
    phone: '+15559876543',
    customFields: { company: 'Apex Solutions', tier: 'Gold VIP' },
  };

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)));

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            Quick Message Templates
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Canned responses and dynamic message snippets with safe variable substitution
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg pl-8 pr-3 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-200"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20 flex flex-col items-center">
            <FileText className="h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Templates Found</h3>
            <p className="text-zinc-500 text-xs max-w-sm mt-1 mb-4">
              Create reusable messages with placeholders like {'{{name}}'} and {'{{phone}}'}.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
            >
              Add Template
            </button>
          </div>
        ) : (
          filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition flex flex-col justify-between gap-3 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {tpl.category || 'General'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(tpl)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(tpl)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-zinc-100 mb-1">{tpl.title}</h4>
                <p className="text-zinc-400 text-xs line-clamp-3 whitespace-pre-wrap">
                  {tpl.content}
                </p>
              </div>

              {tpl.variables?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-800/80">
                  {tpl.variables.map((v) => (
                    <span
                      key={v}
                      className="text-[10px] font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" />
                {editingTemplate ? 'Edit Message Template' : 'New Message Template'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              <div>
                <label className="font-semibold text-zinc-200 block mb-1">Template Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Welcome Message"
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-200 block mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Sales, Support, Onboarding"
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-200 block mb-1">Template Content</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hello {{contact.name}}, thanks for reaching out to {{custom.company}}!"
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg p-3 text-zinc-100 placeholder-zinc-500"
                  required
                />
                <span className="text-[10px] text-zinc-400">
                  Insert dynamic variables: {'{{name}}'}, {'{{phone}}'}, {'{{custom.field}}'}
                </span>
              </div>

              {content && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Sample Contact Preview
                  </span>
                  <p className="text-zinc-200 whitespace-pre-wrap">
                    {SafeTemplate.render(content, { contact: sampleContact })}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

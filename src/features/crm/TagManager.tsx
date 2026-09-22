import React, { useState, useEffect } from 'react';
import { Tag as TagIcon, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Tag } from '@/storage/schemas';
import { db } from '@/storage/db';

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

interface TagManagerProps {
  onClose?: () => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ onClose }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');

  const loadTags = async () => {
    const list = await db.tags.toArray();
    setTags(list);
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const id = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    await db.tags.put({
      id,
      name: newTagName.trim(),
      color: newTagColor,
    });

    setNewTagName('');
    await loadTags();
  };

  const handleUpdate = async (id: string) => {
    if (!editingTagName.trim()) return;
    await db.tags.update(id, { name: editingTagName.trim() });
    setEditingTagId(null);
    await loadTags();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag? It will be unlinked from contacts.')) {
      await db.tags.delete(id);
      await db.contactTags.where('tagId').equals(id).delete();
      await loadTags();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <TagIcon className="h-4 w-4 text-emerald-400" />
            CRM Tags Manager
          </h3>
          <p className="text-zinc-400 text-[11px]">Categorize contacts for automated segmentation</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Create Tag Form */}
      <form onSubmit={handleCreate} className="my-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New tag name (e.g. VIP, Prospect, Follow-up)..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!newTagName.trim()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg flex items-center gap-1 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Tag
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Color:</span>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewTagColor(c)}
              className={`h-5 w-5 rounded-full border-2 transition ${
                newTagColor === c ? 'border-white scale-110' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </form>

      {/* Tags List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 border border-zinc-800 rounded-xl bg-zinc-900/30">
        {tags.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No tags created yet. Create your first tag above.
          </div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="p-3 flex items-center justify-between hover:bg-zinc-900/50 transition">
              {editingTagId === tag.id ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingTagName}
                    onChange={(e) => setEditingTagName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-100"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(tag.id)}
                    className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingTagId(null)}
                    className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-semibold text-zinc-200">{tag.name}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingTagId(tag.id);
                    setEditingTagName(tag.name);
                  }}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                  title="Rename"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

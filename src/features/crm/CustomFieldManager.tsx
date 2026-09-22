import React, { useState, useEffect } from 'react';
import { Settings2, Plus, Trash2, Edit2, Save, X, Hash, Calendar, Type, CheckSquare } from 'lucide-react';

export interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  options?: string[]; // for select / multiselect
  required?: boolean;
}

const STORAGE_KEY = 'openmsg_custom_fields_schema';

export class CustomFieldService {
  static getFields(): CustomFieldDefinition[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback to defaults on parse error
    }

    // Default predefined fields matching spec
    return [
      { id: 'f_company', key: 'company', label: 'Company', type: 'text' },
      { id: 'f_city', key: 'city', label: 'City', type: 'text' },
      { id: 'f_gst', key: 'gstNumber', label: 'GST Number', type: 'text' },
      { id: 'f_order', key: 'orderNumber', label: 'Order Number', type: 'text' },
      { id: 'f_val', key: 'purchaseValue', label: 'Purchase Value', type: 'number' },
      { id: 'f_follow', key: 'nextFollowUp', label: 'Next Follow-up', type: 'date' },
      {
        id: 'f_src',
        key: 'leadSource',
        label: 'Lead Source',
        type: 'select',
        options: ['Website', 'Referral', 'WhatsApp Ad', 'Cold Outreach', 'Event'],
      },
    ];
  }

  static saveFields(fields: CustomFieldDefinition[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
  }
}

export const CustomFieldManager: React.FC = () => {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);

  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState<CustomFieldDefinition['type']>('text');
  const [optionsStr, setOptionsStr] = useState('');

  useEffect(() => {
    setFields(CustomFieldService.getFields());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !key.trim()) return;

    const formattedKey = key.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const options = (type === 'select' || type === 'multiselect')
      ? optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const newField: CustomFieldDefinition = {
      id: editingField?.id || `f_${Date.now()}`,
      key: formattedKey,
      label: label.trim(),
      type,
      options,
    };

    const updated = editingField
      ? fields.map((f) => (f.id === editingField.id ? newField : f))
      : [...fields, newField];

    setFields(updated);
    CustomFieldService.saveFields(updated);
    setIsModalOpen(false);
    setEditingField(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to remove this custom field definition?')) return;
    const updated = fields.filter((f) => f.id !== id);
    setFields(updated);
    CustomFieldService.saveFields(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-blue-400" />
            CRM Custom Fields Schema
          </h1>
          <p className="text-xs text-zinc-400">
            Define attributes (e.g. Company, GST, Order Number) attached to customer profiles and available in workflow variables.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingField(null);
            setLabel('');
            setKey('');
            setType('text');
            setOptionsStr('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>New Field</span>
        </button>
      </div>

      {/* Fields Table */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <div className="grid grid-cols-4 gap-3 px-4 py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
          <span>Field Label</span>
          <span>Variable Key</span>
          <span>Data Type</span>
          <span className="text-right">Actions</span>
        </div>

        {fields.map((f) => (
          <div
            key={f.id}
            className="grid grid-cols-4 gap-3 items-center px-4 py-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl transition text-xs"
          >
            <div className="font-semibold text-zinc-200">{f.label}</div>
            <div className="font-mono text-zinc-400">
              &#123;&#123;contact.{f.key}&#125;&#125;
            </div>
            <div className="flex items-center gap-1.5 capitalize text-zinc-300">
              {f.type === 'number' && <Hash className="h-3.5 w-3.5 text-blue-400" />}
              {f.type === 'date' && <Calendar className="h-3.5 w-3.5 text-amber-400" />}
              {f.type === 'text' && <Type className="h-3.5 w-3.5 text-emerald-400" />}
              {f.type === 'boolean' && <CheckSquare className="h-3.5 w-3.5 text-purple-400" />}
              <span>{f.type}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditingField(f);
                  setLabel(f.label);
                  setKey(f.key);
                  setType(f.type);
                  setOptionsStr(f.options?.join(', ') || '');
                  setIsModalOpen(true);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(f.id)}
                className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-blue-400" />
                <span>{editingField ? 'Edit Custom Field' : 'New Custom Field'}</span>
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
                <label className="text-xs font-semibold text-zinc-300">Field Label</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    if (!editingField) {
                      setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    }
                  }}
                  placeholder="e.g. GST Number, Lead Source, Purchase Value"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Variable Key</label>
                <input
                  type="text"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. gstNumber, leadSource"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Data Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="text">Text (String)</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean (Yes / No)</option>
                  <option value="select">Single Select</option>
                  <option value="multiselect">Multi Select</option>
                </select>
              </div>

              {(type === 'select' || type === 'multiselect') && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Options (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

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
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Field</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

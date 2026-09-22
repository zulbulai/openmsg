import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Contact } from '@/storage/schemas';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';

interface ContactModalProps {
  contact?: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [stageId, setStageId] = useState('lead');
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string; type: string }>>([]);
  const [duplicateMatch, setDuplicateMatch] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 6) {
      setDuplicateMatch(null);
      return;
    }
    const timer = setTimeout(async () => {
      const existing = await db.contacts
        .filter((c) => c.phone === cleanPhone && c.id !== contact?.id)
        .first();
      setDuplicateMatch(existing || null);
    }, 200);
    return () => clearTimeout(timer);
  }, [phone, contact]);

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || contact.id.replace('@c.us', ''));
      setStageId(contact.stageId || 'lead');
      const fields = Object.entries(contact.customFields || {}).map(([key, val]) => ({
        key,
        value: String(val),
        type: typeof val === 'number' ? 'NUMBER' : typeof val === 'boolean' ? 'BOOLEAN' : 'TEXT',
      }));
      setCustomFields(fields);
    } else {
      setName('');
      setPhone('');
      setStageId('lead');
      setCustomFields([]);
    }
  }, [contact, isOpen]);

  if (!isOpen) return null;

  const handleAddField = () => {
    setCustomFields((prev) => [...prev, { key: '', value: '', type: 'TEXT' }]);
  };

  const handleRemoveField = (idx: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert('A valid phone number is required.');
      return;
    }

    setIsSaving(true);
    try {
      const formattedFields: Record<string, string | number | boolean> = {};
      customFields.forEach((f) => {
        if (!f.key.trim()) return;
        if (f.type === 'NUMBER') {
          formattedFields[f.key.trim()] = Number(f.value) || 0;
        } else if (f.type === 'BOOLEAN') {
          formattedFields[f.key.trim()] = f.value.toLowerCase() === 'true';
        } else {
          formattedFields[f.key.trim()] = f.value;
        }
      });

      const contactId = `${cleanPhone}@c.us`;
      await ContactRepository.upsert({
        id: contactId,
        phone: cleanPhone,
        name: name.trim() || `Contact ${cleanPhone}`,
        isGroup: false,
        stageId,
        customFields: formattedFields,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      alert(`Failed to save contact: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100">
            {contact ? 'Edit Contact' : 'Create New Contact'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">
              WhatsApp Phone Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 15551234567 (with country code)"
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              required
            />
            {duplicateMatch && (
              <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  Potential duplicate: <strong>{duplicateMatch.name || duplicateMatch.phone}</strong> already exists.
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">CRM Stage</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="lead">Lead</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="customer">Customer</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          {/* Custom Fields Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-semibold">Custom Fields</label>
              <button
                type="button"
                onClick={handleAddField}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Field
              </button>
            </div>

            {customFields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Field name (e.g. company)"
                  value={field.key}
                  onChange={(e) => {
                    const updated = [...customFields];
                    updated[idx].key = e.target.value;
                    setCustomFields(updated);
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-700/60 rounded px-2.5 py-1.5 text-zinc-100"
                />
                <select
                  value={field.type}
                  onChange={(e) => {
                    const updated = [...customFields];
                    updated[idx].type = e.target.value;
                    setCustomFields(updated);
                  }}
                  className="bg-zinc-950 border border-zinc-700/60 rounded px-2 py-1.5 text-zinc-300"
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="DATE">Date</option>
                  <option value="BOOLEAN">Boolean</option>
                </select>
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => {
                    const updated = [...customFields];
                    updated[idx].value = e.target.value;
                    setCustomFields(updated);
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-700/60 rounded px-2.5 py-1.5 text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveField(idx)}
                  className="p-1 text-zinc-400 hover:text-rose-400 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5 transition"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

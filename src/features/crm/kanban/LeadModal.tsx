/**
 * OpenMsg Lead Creation & Edit Modal
 * Form for adding new leads or editing existing CRM contacts with pipeline stage, priority, value, and tags.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  User,
  Phone,
  Building,
  Mail,
  Tag as TagIcon,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Contact, CrmPipeline, Tag } from '@/storage/schemas';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';
import { AlarmManager } from '@/background/alarms';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  contact?: Contact | null;
  pipeline: CrmPipeline;
  defaultStageId?: string;
  allTags: Tag[];
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  contact,
  pipeline,
  defaultStageId,
  allTags,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [stageId, setStageId] = useState('');
  const [priority, setPriority] = useState<Contact['priority']>('medium');
  const [leadValue, setLeadValue] = useState<string>('');
  const [leadCurrency, setLeadCurrency] = useState('INR');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [initialNote, setInitialNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);
  const [duplicateMatch, setDuplicateMatch] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || contact.id.replace('@c.us', ''));
      setEmail(String(contact.customFields?.email || ''));
      setCompany(String(contact.customFields?.company || ''));
      setStageId(contact.stageId || defaultStageId || pipeline.stages[0]?.id || '');
      setPriority(contact.priority || 'medium');
      setLeadValue(contact.leadValue !== undefined ? String(contact.leadValue) : '');
      setLeadCurrency(contact.leadCurrency || 'INR');
      setInitialNote('');

      if (contact.nextFollowUp) {
        const d = new Date(contact.nextFollowUp);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setFollowUpDate(iso);
      } else {
        setFollowUpDate('');
      }

      // Load contact tags
      ContactRepository.getTags(contact.id).then((tList) => {
        setSelectedTagIds(tList.map((t) => t.id));
      });

      // Filter out email/company from customFields array
      const extraFields = Object.entries(contact.customFields || {})
        .filter(([k]) => k !== 'email' && k !== 'company')
        .map(([k, v]) => ({ key: k, value: String(v) }));
      setCustomFields(extraFields);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCompany('');
      setStageId(defaultStageId || pipeline.stages[0]?.id || '');
      setPriority('medium');
      setLeadValue('');
      setLeadCurrency('INR');
      setSelectedTagIds([]);
      setInitialNote('');
      setFollowUpDate('');
      setCustomFields([]);
      setDuplicateMatch(null);
    }
  }, [contact, defaultStageId, pipeline, isOpen]);

  // Duplicate phone check
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
    }, 250);
    return () => clearTimeout(timer);
  }, [phone, contact]);

  if (!isOpen) return null;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddField = () => {
    setCustomFields((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert('A valid WhatsApp phone number is required.');
      return;
    }

    setIsSaving(true);
    try {
      const contactId = `${cleanPhone}@c.us`;

      const formattedCustomFields: Record<string, string | number | boolean> = {
        ...(contact?.customFields || {}),
      };

      if (email.trim()) formattedCustomFields.email = email.trim();
      if (company.trim()) formattedCustomFields.company = company.trim();

      customFields.forEach((f) => {
        if (f.key.trim()) {
          formattedCustomFields[f.key.trim()] = f.value.trim();
        }
      });

      const parsedValue = leadValue ? Number(leadValue) : undefined;
      const followUpTimestamp = followUpDate ? new Date(followUpDate).getTime() : undefined;

      const savedContact = await ContactRepository.upsert({
        id: contactId,
        phone: cleanPhone,
        name: name.trim() || `Lead ${cleanPhone}`,
        pipelineId: pipeline.id,
        stageId: stageId || pipeline.stages[0]?.id,
        priority,
        leadValue: isNaN(parsedValue as number) ? undefined : parsedValue,
        leadCurrency,
        nextFollowUp: followUpTimestamp,
        customFields: formattedCustomFields,
      });

      // Assign selected tags
      const currentTags = await ContactRepository.getTags(contactId);
      const currentTagIds = new Set(currentTags.map((t) => t.id));

      for (const tId of selectedTagIds) {
        if (!currentTagIds.has(tId)) {
          await ContactRepository.assignTag(contactId, tId);
        }
      }
      for (const t of currentTags) {
        if (!selectedTagIds.includes(t.id)) {
          await ContactRepository.removeTag(contactId, t.id);
        }
      }

      // Add initial note if provided
      if (initialNote.trim()) {
        await ContactRepository.addNote(contactId, initialNote.trim());
      }

      // Schedule follow-up alarm if requested
      if (followUpTimestamp && followUpTimestamp > Date.now()) {
        const taskId = `sched_lead_${Date.now()}`;
        await db.scheduledMessages.put({
          id: taskId,
          contactId,
          messageText: `Follow-up scheduled with ${savedContact.name}`,
          triggerAt: followUpTimestamp,
          status: 'pending',
          createdAt: Date.now(),
        });
        AlarmManager.schedule(`openmsg:reminder:${taskId}`, followUpTimestamp);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      alert(`Failed to save lead: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[92vh] text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              {contact ? 'Edit CRM Lead' : 'Add New Lead to Pipeline'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Duplicate Warning */}
          {duplicateMatch && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Existing contact found: <strong>{duplicateMatch.name || duplicateMatch.phone}</strong>.
                Saving will update this record.
              </span>
            </div>
          )}

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                WhatsApp Phone <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="h-3.5 w-3.5 absolute left-2.5 top-3 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-8 pr-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Company & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Company / Organization</label>
              <div className="relative">
                <Building className="h-3.5 w-3.5 absolute left-2.5 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-8 pr-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-3.5 w-3.5 absolute left-2.5 top-3 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-8 pr-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Pipeline Stage & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Stage in Pipeline</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {pipeline.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Lead Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Contact['priority'])}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Deal Value & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Deal Potential Value</label>
              <div className="relative">
                <DollarSign className="h-3.5 w-3.5 absolute left-2.5 top-3 text-zinc-500" />
                <input
                  type="number"
                  value={leadValue}
                  onChange={(e) => setLeadValue(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-8 pr-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Currency</label>
              <select
                value={leadCurrency}
                onChange={(e) => setLeadCurrency(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED</option>
              </select>
            </div>
          </div>

          {/* Scheduled Follow-up */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              Next Follow-up Due Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tags Multi-select */}
          {allTags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 text-emerald-400" />
                Assign Tags
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border border-zinc-800 rounded-lg bg-zinc-950/60">
                {allTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Initial Note (for new lead) */}
          {!contact && (
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Initial CRM Note</label>
              <textarea
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder="Add context about this lead, requirement, source, etc..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Custom Fields Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-semibold">Custom Fields</label>
              <button
                type="button"
                onClick={handleAddField}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium text-[11px]"
              >
                <Plus className="h-3 w-3" />
                Add Field
              </button>
            </div>

            {customFields.map((f, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Field name (e.g. Industry)"
                  value={f.key}
                  onChange={(e) => {
                    const next = [...customFields];
                    next[idx].key = e.target.value;
                    setCustomFields(next);
                  }}
                  className="w-1/3 bg-zinc-950 border border-zinc-700/80 rounded px-2.5 py-1.5 text-zinc-100"
                />
                <input
                  type="text"
                  placeholder="Field value (e.g. Retail)"
                  value={f.value}
                  onChange={(e) => {
                    const next = [...customFields];
                    next[idx].value = e.target.value;
                    setCustomFields(next);
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded px-2.5 py-1.5 text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveField(idx)}
                  className="p-1 text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : contact ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

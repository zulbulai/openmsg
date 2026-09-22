import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { Sequence, SequenceStep } from '@/storage/schemas';
import { SequenceRepository } from '@/storage/repositories/sequence.repository';
import { db } from '@/storage/db';

interface SequenceBuilderProps {
  initialSequence?: Sequence;
  onClose: () => void;
}

export const SequenceBuilder: React.FC<SequenceBuilderProps> = ({ initialSequence, onClose }) => {
  const [name, setName] = useState(initialSequence?.name || '');
  const [description, setDescription] = useState(initialSequence?.description || '');
  const [steps, setSteps] = useState<SequenceStep[]>(initialSequence?.steps || []);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    db.templates.toArray().then(setTemplates);
  }, []);

  const handleAddStep = () => {
    const newStep: SequenceStep = {
      id: `step_${Date.now()}`,
      sequenceId: initialSequence?.id || '',
      position: steps.length,
      delayMinutes: steps.length === 0 ? 0 : 1440, // default 1 day delay if not first
      messageText: '',
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    // Re-index
    newSteps.forEach((s, i) => (s.position = i));
    setSteps(newSteps);
  };

  const updateStep = (index: number, updates: Partial<SequenceStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Name is required');
    if (steps.length === 0) return alert('Add at least one step');

    // basic validation
    for (const step of steps) {
      if (!step.messageText && !step.messageTemplateId) {
        return alert('All steps must have a message text or template selected.');
      }
    }

    try {
      if (initialSequence) {
        await SequenceRepository.update(initialSequence.id, {
          name,
          description,
          steps,
        });
      } else {
        const seq = await SequenceRepository.create({
          name,
          description,
          isActive: true,
          steps: [],
        });
        // Set proper sequenceId in steps
        const boundSteps = steps.map(s => ({ ...s, sequenceId: seq.id }));
        await SequenceRepository.update(seq.id, { steps: boundSteps });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save sequence');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      <header className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-bold text-sm">
              {initialSequence ? 'Edit Sequence' : 'New Sequence'}
            </h2>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Sequence
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-2xl space-y-6">
          {/* Metadata */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sequence Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Welcome Drip"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this sequence used for?"
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              Sequence Steps
            </h3>

            {steps.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-8 text-center">
                <AlertCircle className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-4">No steps added yet.</p>
                <button
                  onClick={handleAddStep}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Step
                </button>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {/* Visual connecting line */}
                <div className="absolute top-8 bottom-8 left-[1.375rem] w-px bg-zinc-800 z-0" />

                {steps.map((step, index) => (
                  <div key={step.id} className="relative z-10 flex gap-4">
                    <div className="mt-4 w-12 h-12 shrink-0 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center font-bold text-sm text-zinc-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm font-medium">Wait before sending:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={index === 0 && step.delayMinutes === 0 ? 0 : step.delayMinutes}
                              onChange={(e) => updateStep(index, { delayMinutes: Number(e.target.value) })}
                              className="w-20 bg-zinc-950 border border-zinc-800 rounded text-sm px-2 py-1 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-xs text-zinc-500">minutes</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStep(index)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message Template (Optional)</label>
                          <select
                            value={step.messageTemplateId || ''}
                            onChange={(e) => updateStep(index, { messageTemplateId: e.target.value || undefined, messageText: '' })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
                          >
                            <option value="">-- Select a template --</option>
                            {templates.map(t => (
                              <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                          </select>
                        </div>
                        
                        {!step.messageTemplateId && (
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message Text</label>
                            <textarea
                              value={step.messageText || ''}
                              onChange={(e) => updateStep(index, { messageText: e.target.value })}
                              placeholder="Type message here... (supports {{contact.name}} variables)"
                              rows={3}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 resize-y min-h-[80px]"
                            />
                          </div>
                        )}
                        
                        {!step.messageTemplateId && (
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Media URL (Optional Image/Video)</label>
                            <input
                              type="text"
                              value={step.mediaUrl || ''}
                              onChange={(e) => updateStep(index, { mediaUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {steps.length > 0 && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleAddStep}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add Step
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

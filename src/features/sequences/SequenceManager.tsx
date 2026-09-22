import React, { useState, useEffect } from 'react';
import { Route, Plus, Search, Trash2, Edit2, Power, Users } from 'lucide-react';
import { SequenceRepository } from '@/storage/repositories/sequence.repository';
import { Sequence } from '@/storage/schemas';
import { SequenceBuilder } from './SequenceBuilder';

export const SequenceManager: React.FC = () => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    const list = await SequenceRepository.listAll();
    setSequences(list);

    const counts: Record<string, number> = {};
    for (const seq of list) {
      const enrollments = await SequenceRepository.getSequenceEnrollments(seq.id);
      counts[seq.id] = enrollments.filter(e => e.status === 'ACTIVE' || e.status === 'PAUSED').length;
    }
    setEnrollmentCounts(counts);
  };

  const handleCreate = () => {
    setEditingSequence(null);
    setIsBuilderOpen(true);
  };

  const handleEdit = (seq: Sequence) => {
    setEditingSequence(seq);
    setIsBuilderOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sequence? All active enrollments will be cancelled.')) {
      await SequenceRepository.delete(id);
      await loadSequences();
    }
  };

  const handleToggleActive = async (seq: Sequence) => {
    await SequenceRepository.update(seq.id, { isActive: !seq.isActive });
    await loadSequences();
  };

  const filteredSequences = sequences.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isBuilderOpen) {
    return (
      <SequenceBuilder
        initialSequence={editingSequence || undefined}
        onClose={() => {
          setIsBuilderOpen(false);
          loadSequences();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Route className="text-emerald-500 h-6 w-6" />
            Message Sequences
          </h1>
          <p className="text-zinc-400 mt-1">Build and manage multi-step drip campaigns.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Sequence
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search sequences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredSequences.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <Route className="h-12 w-12 mb-4 opacity-20" />
              <p>No sequences found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSequences.map((seq) => (
                <div key={seq.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 relative group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-base pr-8 truncate">{seq.name}</h3>
                    <button
                      onClick={() => handleToggleActive(seq)}
                      className={`absolute top-5 right-4 h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                        seq.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}
                      title={seq.isActive ? 'Active' : 'Inactive'}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-4 min-h-[32px]">
                    {seq.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Route className="h-3.5 w-3.5" />
                      {seq.steps.length} steps
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {enrollmentCounts[seq.id] || 0} active
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 mt-auto">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(seq)}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Edit Sequence"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(seq.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete Sequence"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-600">
                      Updated {new Date(seq.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

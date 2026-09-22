import React, { useState, useEffect } from 'react';
import { X, Route, Play, Pause, StopCircle } from 'lucide-react';
import { SequenceEnrollment, Sequence } from '@/storage/schemas';
import { SequenceRepository } from '@/storage/repositories/sequence.repository';

interface SequenceEnrollmentModalProps {
  contactId: string;
  onClose: () => void;
}

export const SequenceEnrollmentModal: React.FC<SequenceEnrollmentModalProps> = ({ contactId, onClose }) => {
  const [enrollments, setEnrollments] = useState<(SequenceEnrollment & { sequenceName: string })[]>([]);
  const [availableSequences, setAvailableSequences] = useState<Sequence[]>([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState('');

  useEffect(() => {
    loadData();
  }, [contactId]);

  const loadData = async () => {
    const enrs = await SequenceRepository.getContactEnrollments(contactId);
    const seqs = await SequenceRepository.listAll();
    
    setAvailableSequences(seqs.filter(s => s.isActive));

    const enriched = enrs.map(e => {
      const s = seqs.find(x => x.id === e.sequenceId);
      return { ...e, sequenceName: s?.name || 'Unknown Sequence' };
    });
    setEnrollments(enriched);
  };

  const handleEnroll = async () => {
    if (!selectedSequenceId) return;
    try {
      await SequenceRepository.enrollContact(selectedSequenceId, contactId);
      setSelectedSequenceId('');
      await loadData();
    } catch (err: any) {
      alert(`Failed to enroll: ${err.message}`);
    }
  };

  const handleAction = async (enr: SequenceEnrollment, action: 'pause' | 'resume' | 'cancel') => {
    try {
      if (action === 'pause') {
        await SequenceRepository.pauseEnrollment(enr.sequenceId, contactId);
      } else if (action === 'resume') {
        await SequenceRepository.resumeEnrollment(enr.sequenceId, contactId);
      } else if (action === 'cancel') {
        if (confirm('Are you sure you want to cancel this sequence enrollment?')) {
          await SequenceRepository.unenrollContact(enr.sequenceId, contactId);
        }
      }
      await loadData();
    } catch (err: any) {
      alert(`Failed to perform action: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PAUSED': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CANCELLED': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Route className="h-5 w-5 text-emerald-500" />
            Active Sequences
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Enroll new */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Enroll in Sequence</label>
              <select
                value={selectedSequenceId}
                onChange={(e) => setSelectedSequenceId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">-- Select a sequence --</option>
                {availableSequences.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleEnroll}
              disabled={!selectedSequenceId}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Enroll
            </button>
          </div>

          {/* Current enrollments */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Enrollment History</h3>
            {enrollments.length === 0 ? (
              <div className="text-center p-6 border border-zinc-800 border-dashed rounded-xl text-zinc-500 text-sm">
                This contact is not enrolled in any sequences.
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map(enr => (
                  <div key={enr.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{enr.sequenceName}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(enr.status)}`}>
                          {enr.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {enr.status === 'ACTIVE' && enr.nextStepAt ? (
                          `Next step scheduled for ${new Date(enr.nextStepAt).toLocaleString()}`
                        ) : enr.status === 'COMPLETED' && enr.completedAt ? (
                          `Completed on ${new Date(enr.completedAt).toLocaleString()}`
                        ) : enr.status === 'PAUSED' ? (
                          'Sequence is currently paused.'
                        ) : (
                          `Step index: ${enr.currentStepIndex}`
                        )}
                      </p>
                      {enr.error && (
                        <p className="text-xs text-red-400 mt-1">Error: {enr.error}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {enr.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleAction(enr, 'pause')}
                          className="p-1.5 text-zinc-400 hover:text-amber-400 bg-zinc-900 hover:bg-amber-500/10 border border-zinc-800 rounded transition"
                          title="Pause Sequence"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      {enr.status === 'PAUSED' && (
                        <button
                          onClick={() => handleAction(enr, 'resume')}
                          className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-zinc-900 hover:bg-emerald-500/10 border border-zinc-800 rounded transition"
                          title="Resume Sequence"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {(enr.status === 'ACTIVE' || enr.status === 'PAUSED') && (
                        <button
                          onClick={() => handleAction(enr, 'cancel')}
                          className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 rounded transition"
                          title="Cancel Enrollment"
                        >
                          <StopCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

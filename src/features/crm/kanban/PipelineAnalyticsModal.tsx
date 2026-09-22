/**
 * OpenMsg Pipeline Analytics Modal
 * Comprehensive performance metrics: pipeline value, win rate, stage velocity, and conversion funnel.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  Trophy,
  XCircle,
  DollarSign,
  AlertCircle,
  Users,
} from 'lucide-react';
import { CrmPipeline } from '@/storage/schemas';
import { CrmAnalyticsService, PipelineAnalytics } from '@/core/crm/crm-analytics';

interface PipelineAnalyticsModalProps {
  pipeline: CrmPipeline;
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineAnalyticsModal: React.FC<PipelineAnalyticsModalProps> = ({
  pipeline,
  isOpen,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      CrmAnalyticsService.getPipelineAnalytics(pipeline)
        .then((res) => {
          setAnalytics(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load pipeline analytics:', err);
          setLoading(false);
        });
    }
  }, [isOpen, pipeline]);

  if (!isOpen) return null;

  const formatCurrency = (val: number, currency = 'INR') => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(val);
    } catch {
      return `${currency} ${val.toLocaleString()}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              Pipeline Analytics: {pipeline.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Calculating real pipeline metrics...</div>
        ) : !analytics ? (
          <div className="p-12 text-center text-zinc-500">Unable to calculate metrics.</div>
        ) : (
          <div className="p-5 flex flex-col gap-5 overflow-y-auto">
            {/* Top Key Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <Users className="h-3 w-3 text-zinc-500" />
                  Total Leads
                </span>
                <span className="text-lg font-bold text-zinc-100">{analytics.totalLeads}</span>
                <span className="text-[10px] text-zinc-500">{analytics.openLeads} currently open</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-400" />
                  Pipeline Value
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {formatCurrency(analytics.totalValue, analytics.currency)}
                </span>
                <span className="text-[10px] text-zinc-500">
                  Won: {formatCurrency(analytics.wonValue, analytics.currency)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-400" />
                  Won Deals
                </span>
                <span className="text-lg font-bold text-amber-400">{analytics.wonLeads}</span>
                <span className="text-[10px] text-zinc-500">Win Rate: {analytics.winRate}%</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-rose-400" />
                  Lost Deals
                </span>
                <span className="text-lg font-bold text-rose-400">{analytics.lostLeads}</span>
                <span className="text-[10px] text-zinc-500">
                  Closed: {analytics.wonLeads + analytics.lostLeads}
                </span>
              </div>
            </div>

            {/* Stages Performance Table */}
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-zinc-200">Stage-by-Stage Breakdown</h4>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 font-medium">
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5 text-center">Contacts</th>
                      <th className="p-2.5">Potential Value</th>
                      <th className="p-2.5">Avg Time in Stage</th>
                      <th className="p-2.5 text-right">Conversion to Next</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {analytics.stages.map((st) => (
                      <tr key={st.stageId} className="hover:bg-zinc-900/40">
                        <td className="p-2.5 font-medium text-zinc-200 flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: st.color }}
                          />
                          <span>{st.stageName}</span>
                        </td>

                        <td className="p-2.5 text-center font-mono font-bold text-zinc-300">
                          {st.count}
                        </td>

                        <td className="p-2.5 font-mono text-emerald-400">
                          {st.totalValue > 0 ? formatCurrency(st.totalValue, analytics.currency) : '-'}
                        </td>

                        <td className="p-2.5 font-mono text-zinc-400">
                          {st.averageTimeInStageMs > 0
                            ? CrmAnalyticsService.formatDuration(st.averageTimeInStageMs)
                            : '-'}
                        </td>

                        <td className="p-2.5 text-right font-mono">
                          {st.conversionRateToNext !== undefined ? (
                            <span className="text-sky-400 font-bold">{st.conversionRateToNext}%</span>
                          ) : (
                            <span className="text-zinc-600 italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Data Notice */}
            {!analytics.hasSufficientHistory && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2 text-zinc-500 text-[11px]">
                <AlertCircle className="h-4 w-4 shrink-0 text-zinc-400" />
                <span>
                  Stage conversion rates and velocity become statistically significant once more contacts
                  progress through your pipeline stages over time.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

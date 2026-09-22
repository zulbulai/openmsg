/**
 * OpenMsg CRM Analytics Engine
 * Calculates real pipeline metrics, conversion rates, stage velocity, and deal values.
 */

import { db } from '@/storage/db';
import { CrmPipeline, Contact } from '@/storage/schemas';

export interface StageMetric {
  stageId: string;
  stageName: string;
  color: string;
  count: number;
  totalValue: number;
  averageTimeInStageMs: number;
  conversionRateToNext?: number; // percentage
}

export interface PipelineAnalytics {
  pipelineId: string;
  pipelineName: string;
  totalLeads: number;
  openLeads: number;
  wonLeads: number;
  lostLeads: number;
  winRate: number; // percentage
  totalValue: number;
  wonValue: number;
  currency: string;
  stages: StageMetric[];
  hasSufficientHistory: boolean;
}

export class CrmAnalyticsService {
  /**
   * Calculates comprehensive pipeline metrics based on real database records
   */
  static async getPipelineAnalytics(pipeline: CrmPipeline): Promise<PipelineAnalytics> {
    const contacts = await db.contacts
      .filter((c) => Boolean(!c.isArchived && (c.pipelineId === pipeline.id || (!c.pipelineId && pipeline.isDefault))))
      .toArray();

    const history = await db.stageHistory.where('pipelineId').equals(pipeline.id).toArray();

    let totalValue = 0;
    let wonValue = 0;
    let wonLeads = 0;
    let lostLeads = 0;
    let openLeads = 0;

    const stageMap = new Map(pipeline.stages.map((s) => [s.id, s]));
    const stageContacts = new Map<string, Contact[]>();
    pipeline.stages.forEach((s) => stageContacts.set(s.id, []));

    contacts.forEach((c) => {
      const sId = c.stageId || pipeline.stages[0]?.id;
      const stage = stageMap.get(sId);

      const val = Number(c.leadValue) || 0;
      totalValue += val;

      if (stage?.isWon) {
        wonLeads++;
        wonValue += val;
      } else if (stage?.isLost) {
        lostLeads++;
      } else {
        openLeads++;
      }

      if (stageContacts.has(sId)) {
        stageContacts.get(sId)!.push(c);
      }
    });

    const closedLeads = wonLeads + lostLeads;
    const winRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;

    // Calculate time in stage and conversion rates from history
    const stageTimes: Record<string, number[]> = {};
    const transitions: Record<string, Record<string, number>> = {};
    const entriesPerStage: Record<string, number> = {};

    history.forEach((h) => {
      if (!entriesPerStage[h.toStageId]) entriesPerStage[h.toStageId] = 0;
      entriesPerStage[h.toStageId]++;

      if (h.fromStageId) {
        if (!transitions[h.fromStageId]) transitions[h.fromStageId] = {};
        if (!transitions[h.fromStageId][h.toStageId]) transitions[h.fromStageId][h.toStageId] = 0;
        transitions[h.fromStageId][h.toStageId]++;
      }
    });

    // Also include current stay duration for active contacts
    const now = Date.now();
    contacts.forEach((c) => {
      const sId = c.stageId || pipeline.stages[0]?.id;
      const stayDuration = now - (c.stageChangedAt || c.updatedAt || c.createdAt);
      if (stayDuration > 0) {
        if (!stageTimes[sId]) stageTimes[sId] = [];
        stageTimes[sId].push(stayDuration);
      }
    });

    const stageMetrics: StageMetric[] = pipeline.stages.map((stage, idx) => {
      const stageCList = stageContacts.get(stage.id) || [];
      const stageVal = stageCList.reduce((acc, curr) => acc + (Number(curr.leadValue) || 0), 0);

      // Average time in stage
      const times = stageTimes[stage.id] || [];
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      // Conversion rate to next stage if next stage exists
      let conversionRate: number | undefined;
      const nextStage = pipeline.stages[idx + 1];
      if (nextStage && history.length >= 5) {
        const fromStageTransitions = transitions[stage.id];
        const nextTransitions = fromStageTransitions ? fromStageTransitions[nextStage.id] || 0 : 0;
        const totalFrom = entriesPerStage[stage.id] || stageCList.length;
        if (totalFrom > 0) {
          conversionRate = Math.min(100, Math.round((nextTransitions / totalFrom) * 100));
        }
      }

      return {
        stageId: stage.id,
        stageName: stage.name,
        color: stage.color || '#3b82f6',
        count: stageCList.length,
        totalValue: stageVal,
        averageTimeInStageMs: Math.round(avgTime),
        conversionRateToNext: conversionRate,
      };
    });

    return {
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      totalLeads: contacts.length,
      openLeads,
      wonLeads,
      lostLeads,
      winRate,
      totalValue,
      wonValue,
      currency: contacts[0]?.leadCurrency || 'INR',
      stages: stageMetrics,
      hasSufficientHistory: history.length >= 3,
    };
  }

  /**
   * Formats duration in milliseconds to human readable string (e.g. "2.4 days", "5 hours")
   */
  static formatDuration(ms: number): string {
    if (ms <= 0) return '0 hrs';
    const hours = ms / (1000 * 60 * 60);
    if (hours < 24) {
      return `${Math.max(1, Math.round(hours))}h`;
    }
    const days = hours / 24;
    return `${days.toFixed(1)} days`;
  }
}

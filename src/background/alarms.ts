import { MessageBus } from '@/core/events/message-bus';
import { db } from '@/storage/db';
import { WorkflowEngine } from '@/workflow-engine/engine';
import { getWhatsAppClient } from '@/content/whatsapp';
import { ReminderService } from '@/core/crm/reminder.service';
import { SequenceEngine } from '@/core/sequences/sequence-engine';

export class AlarmManager {
  static init(): void {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;

    // Listen for alarms
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      console.log('[OpenMsg Background] Alarm triggered:', alarm.name);

      // Notify runtime listeners
      MessageBus.send({
        type: 'ALARM_FIRED',
        payload: {
          alarmId: alarm.name,
          timestamp: Date.now(),
        },
      }).catch((err) => {
        console.debug('[OpenMsg Background] No active UI listeners for alarm:', err.message);
      });

      // Handle Workflow Delays (wf_delay_{executionId}_{nodeId})
      if (alarm.name.startsWith('wf_delay_')) {
        const parts = alarm.name.split('_');
        const executionId = parts.slice(2, -1).join('_') || parts[2];

        try {
          const execution = await db.workflowExecutions.get(executionId);
          if (execution && (execution.status === 'WAITING' || execution.status === 'WAITING_DELAY')) {
            const workflow = await db.workflows.get(execution.workflowId);
            if (workflow && workflow.isActive) {
              const client = getWhatsAppClient();
              const engine = new WorkflowEngine({ client });

              const context = {
                executionId: execution.id,
                workflowId: execution.workflowId,
                contactId: execution.contactId,
                variables: execution.variables,
                currentNodeId: execution.currentNodeId,
                status: 'RUNNING' as const,
                logs: [`Resumed workflow after persistent delay at ${new Date().toISOString()}`],
              };

              const resumed = await engine.runUntilHalt(workflow, context);
              await db.workflowExecutions.update(execution.id, {
                status: resumed.status as any,
                currentNodeId: resumed.currentNodeId,
                variables: resumed.variables,
                updatedAt: Date.now(),
                completedAt: resumed.status === 'COMPLETED' ? Date.now() : undefined,
                error: resumed.error,
              });
            }
          }
        } catch (err) {
          console.error('[OpenMsg Background] Failed to resume delayed workflow execution:', err);
        }
      }

      // Handle Follow-up Reminder alarms (fu_reminder_{followUpId})
      if (alarm.name.startsWith('fu_reminder_')) {
        const followUpId = ReminderService.extractFollowUpId(alarm.name);
        if (followUpId) {
          try {
            await ReminderService.handleAlarmFired(followUpId);
          } catch (err) {
            console.error('[OpenMsg Background] Failed to handle follow-up reminder alarm:', err);
          }
        }
      }

      // Handle Sequence Drip Execution (seq_exec_{enrollmentId})
      if (alarm.name.startsWith('seq_exec_')) {
        const enrollmentId = alarm.name.replace('seq_exec_', '');
        try {
          const client = getWhatsAppClient();
          const engine = new SequenceEngine(client);
          await engine.processEnrollment(enrollmentId);
        } catch (err) {
          console.error('[OpenMsg Background] Failed to process sequence step:', err);
        }
      }

      // Legacy appointment reminder alarms (openmsg:reminder:)
      if (alarm.name.startsWith('openmsg:reminder:')) {
        const id = alarm.name.replace('openmsg:reminder:', '');
        chrome.notifications?.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'OpenMsg - Follow-up Reminder',
          message: `Scheduled follow-up reminder (${id}) is due now.`,
          priority: 2,
        });
      }
    });

    // Reconcile pending alarms on startup
    this.reconcileAlarms();
  }

  /**
   * Reconciles alarms and pending executions across restarts
   */
  static async reconcileAlarms(): Promise<void> {
    try {
      const pendingExecs = await db.workflowExecutions
        .filter((e) => e.status === 'WAITING' || e.status === 'WAITING_DELAY')
        .toArray();

      const now = Date.now();
      for (const exec of pendingExecs) {
        if (!exec.resumeAt) continue;

        const alarmName = `wf_delay_${exec.id}_${exec.currentNodeId}`;
        if (exec.resumeAt <= now) {
          // Time already passed during browser shutdown, resume immediately
          chrome.alarms?.create(alarmName, { delayInMinutes: 0.05 });
        } else {
          // Re-schedule alarm for future
          this.schedule(alarmName, exec.resumeAt);
        }
      }
      console.log(`[OpenMsg Background] Reconciled ${pendingExecs.length} pending workflow delay executions.`);

      // Reconcile follow-up reminder alarms
      try {
        await ReminderService.rebuildAll();
      } catch (fuErr) {
        console.debug('[OpenMsg Background] Follow-up reminder reconciliation deferred:', fuErr);
      }

      // Reconcile sequence enrollments
      try {
        const activeEnrollments = await db.sequenceEnrollments
          .where('status')
          .equals('ACTIVE')
          .toArray();

        for (const enr of activeEnrollments) {
          if (enr.nextStepAt) {
            if (enr.nextStepAt <= now) {
              chrome.alarms?.create(`seq_exec_${enr.id}`, { delayInMinutes: 0.05 });
            } else {
              this.schedule(`seq_exec_${enr.id}`, enr.nextStepAt);
            }
          }
        }
      } catch (seqErr) {
        console.debug('[OpenMsg Background] Sequence reconciliation deferred:', seqErr);
      }
    } catch (err) {
      console.debug('[OpenMsg Background] DB not ready during alarm reconciliation, will retry:', err);
    }
  }

  static schedule(alarmId: string, triggerAt: number): void {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;

    // Must be in the future
    const delayInMinutes = Math.max((triggerAt - Date.now()) / 60000, 0.05); // at least 3 seconds
    chrome.alarms.create(alarmId, { delayInMinutes });
    console.log(`[OpenMsg Background] Scheduled alarm ${alarmId} for ${new Date(triggerAt).toISOString()}`);
  }

  static cancel(alarmId: string): void {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;
    chrome.alarms.clear(alarmId);
    console.log(`[OpenMsg Background] Cleared alarm ${alarmId}`);
  }
}

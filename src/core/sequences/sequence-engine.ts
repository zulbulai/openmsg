import { db } from '@/storage/db';
import { WhatsAppClient } from '@/types/whatsapp';
import { SafeTemplate } from '@/core/template/safe-template';
import { AlarmManager } from '@/background/alarms';

export class SequenceEngine {
  private client: WhatsAppClient;

  constructor(client: WhatsAppClient) {
    this.client = client;
  }

  /**
   * Processes a specific sequence enrollment up to its current step,
   * sends the message, and schedules the next step.
   */
  async processEnrollment(enrollmentId: string): Promise<void> {
    const enrollment = await db.sequenceEnrollments.get(enrollmentId);
    if (!enrollment || enrollment.status !== 'ACTIVE') return;

    const sequence = await db.sequences.get(enrollment.sequenceId);
    if (!sequence || !sequence.isActive) {
      // Sequence was deleted or deactivated
      return;
    }

    const step = sequence.steps[enrollment.currentStepIndex];
    if (!step) {
      // No more steps, sequence is complete
      await this.markCompleted(enrollment.id);
      return;
    }

    try {
      // 1. Send the message for the current step
      if (step.messageText) {
        const renderedText = SafeTemplate.render(step.messageText, {
          contact: { id: enrollment.contactId },
        });

        if (step.mediaUrl) {
          // If media URL is provided, we infer basic media send (image default)
          // For a fully production system, we'd have a mediaType field
          await this.client.sendImage({
            chatId: enrollment.contactId,
            media: step.mediaUrl,
            caption: renderedText,
          });
        } else {
          await this.client.sendText({
            chatId: enrollment.contactId,
            text: renderedText,
          });
        }
      } else if (step.messageTemplateId) {
        // Fallback for template rendering
        const template = await db.templates.get(step.messageTemplateId);
        if (template) {
          const renderedText = SafeTemplate.render(template.content, {
            contact: { id: enrollment.contactId },
          });
          await this.client.sendText({
            chatId: enrollment.contactId,
            text: renderedText,
          });
        }
      }

      // 2. Advance to the next step
      enrollment.currentStepIndex += 1;
      const nextStep = sequence.steps[enrollment.currentStepIndex];

      if (nextStep) {
        // Schedule next step based on its delay
        const delayMs = nextStep.delayMinutes * 60000;
        enrollment.nextStepAt = Date.now() + delayMs;
        await db.sequenceEnrollments.put(enrollment);

        // Register Chrome Alarm
        AlarmManager.schedule(`seq_exec_${enrollment.id}`, enrollment.nextStepAt);
      } else {
        // We just executed the last step
        await this.markCompleted(enrollment.id);
      }
    } catch (err: any) {
      console.error(`[SequenceEngine] Error processing enrollment ${enrollment.id}:`, err);
      enrollment.status = 'FAILED';
      enrollment.error = err.message || String(err);
      await db.sequenceEnrollments.put(enrollment);
    }
  }

  private async markCompleted(enrollmentId: string): Promise<void> {
    const enrollment = await db.sequenceEnrollments.get(enrollmentId);
    if (enrollment) {
      enrollment.status = 'COMPLETED';
      enrollment.completedAt = Date.now();
      enrollment.nextStepAt = undefined;
      await db.sequenceEnrollments.put(enrollment);
      // Clean up alarm if exists
      AlarmManager.cancel(`seq_exec_${enrollment.id}`);
    }
  }
}

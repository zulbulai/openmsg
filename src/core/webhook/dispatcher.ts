/**
 * OpenMsg Webhook Dispatcher
 * Dispatches outbound events to registered webhooks with HMAC signatures and SSRF safeguards.
 */

import { SSRFGuard } from '@/core/security/ssrf';
import { db } from '@/storage/db';
import { WebhookConfig } from '@/storage/schemas';

export interface WebhookEventPayload {
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export class WebhookDispatcher {
  /**
   * Dispatches an event to all enabled webhooks subscribed to that event type
   */
  static async dispatch(eventType: string, data: Record<string, unknown>): Promise<void> {
    const webhooks = await db.webhooks
      .filter((w) => w.enabled && (w.events.includes(eventType) || w.events.includes('*')))
      .toArray();

    if (webhooks.length === 0) return;

    const payload: WebhookEventPayload = {
      event: eventType,
      timestamp: Date.now(),
      data,
    };

    for (const webhook of webhooks) {
      await this.sendToEndpoint(webhook, payload);
    }
  }

  /**
   * Delivers an individual webhook payload
   */
  private static async sendToEndpoint(
    webhook: WebhookConfig,
    payload: WebhookEventPayload
  ): Promise<boolean> {
    const check = SSRFGuard.validateUrl(webhook.url);
    if (!check.allowed) {
      console.warn(`[Webhook] Blocked delivery to ${webhook.url}: ${check.reason}`);
      return false;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'OpenMsg-Webhook-Dispatcher/0.1.0',
      'X-OpenMsg-Event': payload.event,
    };

    if (webhook.secret) {
      try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhook.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signature = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(JSON.stringify(payload))
        );
        const hashHex = Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        headers['X-OpenMsg-Signature'] = `sha256=${hashHex}`;
      } catch (e) {
        console.error('Failed to sign webhook payload:', e);
      }
    }

    try {
      const response = await SSRFGuard.safeFetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (err) {
      console.error(`[Webhook] Delivery failed to ${webhook.url}:`, err);
      return false;
    }
  }
}

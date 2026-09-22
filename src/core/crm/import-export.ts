/**
 * OpenMsg CRM Import & Export Engine
 * Validates, serializes, and deserializes contact datasets (CSV and JSON) with pipeline & stage support.
 */

import { Contact } from '@/storage/schemas';
import { ContactRepository } from '@/storage/repositories/contact.repository';

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

export interface ImportOptions {
  defaultPipelineId?: string;
  defaultStageId?: string;
}

export class CRMDataTransfer {
  /**
   * Serializes a list of contacts to structured JSON string
   */
  static exportToJSON(contacts: Contact[]): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      type: 'openmsg_contacts_export',
      data: contacts,
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Serializes a list of contacts to CSV format
   */
  static exportToCSV(contacts: Contact[]): string {
    const headers = [
      'id',
      'phone',
      'name',
      'pushName',
      'isGroup',
      'pipelineId',
      'stageId',
      'priority',
      'leadValue',
      'leadCurrency',
      'createdAt',
    ];
    const rows = contacts.map((c) => [
      `"${c.id || ''}"`,
      `"${c.phone || ''}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.pushName || '').replace(/"/g, '""')}"`,
      c.isGroup ? 'true' : 'false',
      `"${c.pipelineId || ''}"`,
      `"${c.stageId || ''}"`,
      `"${c.priority || 'medium'}"`,
      c.leadValue !== undefined ? String(c.leadValue) : '',
      `"${c.leadCurrency || 'INR'}"`,
      c.createdAt || Date.now(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Validates and imports JSON contacts data
   */
  static async importFromJSON(rawJson: string, options?: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      imported: 0,
      failed: 0,
      errors: [],
    };

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error('Invalid JSON format');
    }

    const items = Array.isArray(parsed)
      ? parsed
      : (parsed as Record<string, unknown>)?.data;
    if (!Array.isArray(items)) {
      throw new Error('JSON structure must contain an array of contact objects');
    }

    result.total = items.length;

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>;
      try {
        if (!item || typeof item !== 'object') {
          throw new Error('Item must be a contact object');
        }

        const phone = String(item.phone || '').replace(/[^0-9]/g, '');
        const id = (item.id as string) || (phone ? `${phone}@c.us` : null);
        const name = String(item.name || item.pushName || phone || 'Imported Contact').trim();

        if (!id) {
          throw new Error('Missing contact phone number or ID');
        }

        const pipelineId = (item.pipelineId as string) || options?.defaultPipelineId;
        const stageId = (item.stageId as string) || options?.defaultStageId;
        const priority = (item.priority as Contact['priority']) || 'medium';
        const leadValue = item.leadValue !== undefined ? Number(item.leadValue) : undefined;
        const leadCurrency = (item.leadCurrency as string) || 'INR';

        await ContactRepository.upsert({
          id,
          phone,
          name,
          pushName: item.pushName as string | undefined,
          isGroup: Boolean(item.isGroup),
          pipelineId,
          stageId,
          priority,
          leadValue,
          leadCurrency,
          customFields: (item.customFields as Record<string, string | number | boolean>) || {},
        });

        result.imported++;
      } catch (err: unknown) {
        result.failed++;
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push({ index: i, error: message });
      }
    }

    return result;
  }

  /**
   * Validates and imports CSV contacts data
   */
  static async importFromCSV(rawCsv: string, options?: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      imported: 0,
      failed: 0,
      errors: [],
    };

    const lines = rawCsv
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      return result;
    }

    // First line is header
    const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    const phoneIdx = headers.findIndex((h) => h.includes('phone') || h === 'mobile' || h === 'number');
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const stageIdx = headers.findIndex((h) => h.includes('stage'));
    const pipeIdx = headers.findIndex((h) => h.includes('pipeline'));
    const priorityIdx = headers.findIndex((h) => h.includes('priority'));
    const valueIdx = headers.findIndex((h) => h.includes('value') || h.includes('amount'));

    result.total = lines.length - 1;

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
        const phone = phoneIdx !== -1 ? cols[phoneIdx]?.replace(/[^0-9]/g, '') : cols[0]?.replace(/[^0-9]/g, '');
        const name = nameIdx !== -1 ? cols[nameIdx] : (phone ? `Contact ${phone}` : 'Unnamed');

        if (!phone) {
          throw new Error('No valid phone number found in row');
        }

        const id = `${phone}@c.us`;
        const stageId = (stageIdx !== -1 ? cols[stageIdx] : '') || options?.defaultStageId;
        const pipelineId = (pipeIdx !== -1 ? cols[pipeIdx] : '') || options?.defaultPipelineId;
        const rawPriority = priorityIdx !== -1 ? cols[priorityIdx]?.toLowerCase() : 'medium';
        const priority: Contact['priority'] = ['low', 'medium', 'high', 'urgent'].includes(rawPriority)
          ? (rawPriority as Contact['priority'])
          : 'medium';
        const leadValue = valueIdx !== -1 && cols[valueIdx] ? Number(cols[valueIdx].replace(/[^0-9.]/g, '')) : undefined;

        await ContactRepository.upsert({
          id,
          phone,
          name: name || phone,
          isGroup: false,
          pipelineId,
          stageId,
          priority,
          leadValue: isNaN(leadValue as number) ? undefined : leadValue,
        });

        result.imported++;
      } catch (err: unknown) {
        result.failed++;
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push({ index: i, error: message });
      }
    }

    return result;
  }
}

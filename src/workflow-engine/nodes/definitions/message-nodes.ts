/**
 * Messaging Node Definitions
 * SEND_TEXT, SEND_IMAGE, SEND_VIDEO, SEND_AUDIO, SEND_DOCUMENT, BUTTONS, LIST
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult, NodeExecutionServices } from '../types';
import { WorkflowNode } from '@/storage/schemas';
import { WorkflowExecutionContext } from '../../context';
import { SafeTemplate } from '@/core/template/safe-template';

export class SendTextNode implements NodeDefinition {
  readonly type = 'SEND_TEXT';
  readonly label = 'Send Text';
  readonly description = 'Sends a formatted WhatsApp text message';
  readonly icon = 'MessageSquare';
  readonly category = 'messaging';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    const text = data.text || data.content;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { valid: false, errors: ['Message text content is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const raw = (node.data.text || node.data.content || '') as string;
    const rendered = SafeTemplate.render(raw, {
      variables: context.variables,
      contact: { id: context.contactId },
    });

    if (services.client) {
      await services.client.sendText({
        chatId: context.contactId,
        text: rendered,
      });
    }

    context.logs.push(`Sent text message to ${context.contactId}: "${rendered}"`);
    return { status: 'CONTINUE', output: { sentText: rendered } };
  }
}

export class SendImageNode implements NodeDefinition {
  readonly type = 'SEND_IMAGE';
  readonly label = 'Send Image';
  readonly description = 'Sends an image with an optional caption';
  readonly icon = 'Image';
  readonly category = 'messaging';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.mediaUrl && !data.dataUrl) {
      return { valid: false, errors: ['Image URL or data is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const media = (node.data.mediaUrl || node.data.dataUrl) as string;
    const caption = SafeTemplate.render((node.data.caption as string) || '', {
      variables: context.variables,
      contact: { id: context.contactId },
    });

    if (services.client) {
      await services.client.sendImage({
        chatId: context.contactId,
        media,
        caption,
      });
    }

    context.logs.push(`Sent image to ${context.contactId}`);
    return { status: 'CONTINUE', output: { media, caption } };
  }
}

export class SendVideoNode implements NodeDefinition {
  readonly type = 'SEND_VIDEO';
  readonly label = 'Send Video';
  readonly description = 'Sends a video with an optional caption';
  readonly icon = 'Video';
  readonly category = 'messaging';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.mediaUrl && !data.dataUrl) {
      return { valid: false, errors: ['Video URL or data is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const media = (node.data.mediaUrl || node.data.dataUrl) as string;
    const caption = SafeTemplate.render((node.data.caption as string) || '', {
      variables: context.variables,
      contact: { id: context.contactId },
    });

    if (services.client) {
      await services.client.sendVideo({
        chatId: context.contactId,
        media,
        caption,
      });
    }

    context.logs.push(`Sent video to ${context.contactId}`);
    return { status: 'CONTINUE', output: { media, caption } };
  }
}

export class SendAudioNode implements NodeDefinition {
  readonly type = 'SEND_AUDIO';
  readonly label = 'Send Audio';
  readonly description = 'Sends an audio message or voice note';
  readonly icon = 'Mic';
  readonly category = 'messaging';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.mediaUrl && !data.dataUrl) {
      return { valid: false, errors: ['Audio URL or data is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const media = (node.data.mediaUrl || node.data.dataUrl) as string;

    if (services.client) {
      await services.client.sendAudio({
        chatId: context.contactId,
        media,
      });
    }

    context.logs.push(`Sent audio to ${context.contactId}`);
    return { status: 'CONTINUE', output: { media } };
  }
}

export class SendDocumentNode implements NodeDefinition {
  readonly type = 'SEND_DOCUMENT';
  readonly label = 'Send Document';
  readonly description = 'Sends a PDF, spreadsheet, or file attachment';
  readonly icon = 'FileText';
  readonly category = 'messaging';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.mediaUrl && !data.dataUrl) {
      return { valid: false, errors: ['Document file data or URL is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const media = (node.data.mediaUrl || node.data.dataUrl) as string;
    const filename = (node.data.filename as string) || 'document.pdf';
    const mimetype = (node.data.mimetype as string) || 'application/pdf';

    if (services.client) {
      await services.client.sendDocument({
        chatId: context.contactId,
        media,
        filename,
        mimetype,
      });
    }

    context.logs.push(`Sent document (${filename}) to ${context.contactId}`);
    return { status: 'CONTINUE', output: { filename, mimetype } };
  }
}

export class ButtonsNode implements NodeDefinition {
  readonly type = 'BUTTONS';
  readonly label = 'Buttons Menu';
  readonly description = 'Sends an interactive message with quick-reply button options';
  readonly icon = 'LayoutGrid';
  readonly category = 'messaging';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.body) {
      return { valid: false, errors: ['Body text is required for buttons message'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const rawBody = (node.data.body as string) || '';
    const body = SafeTemplate.render(rawBody, { variables: context.variables });
    const buttons = (node.data.buttons as Array<{ id: string; text: string }>) || [];

    // Format buttons as readable menu for WhatsApp Web compatibility
    const formatted = `${body}\n\n` + buttons.map((b, i) => `[${i + 1}] ${b.text}`).join('\n');

    if (services.client) {
      await services.client.sendText({
        chatId: context.contactId,
        text: formatted,
      });
    }

    context.logs.push(`Sent buttons message to ${context.contactId}`);
    return { status: 'CONTINUE', output: { formatted } };
  }
}

export class ListNode implements NodeDefinition {
  readonly type = 'LIST';
  readonly label = 'List Menu';
  readonly description = 'Sends a structured menu with selectable options';
  readonly icon = 'List';
  readonly category = 'messaging';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.title) {
      return { valid: false, errors: ['List menu title is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const title = (node.data.title as string) || 'Menu Options';
    const items = (node.data.items as Array<{ title: string; description?: string }>) || [];

    const formatted = `*${title}*\n` + items.map((it, idx) => `${idx + 1}. *${it.title}*${it.description ? ` - ${it.description}` : ''}`).join('\n');

    if (services.client) {
      await services.client.sendText({
        chatId: context.contactId,
        text: formatted,
      });
    }

    context.logs.push(`Sent list menu to ${context.contactId}`);
    return { status: 'CONTINUE', output: { formatted } };
  }
}

/**
 * OpenMsg Safe Template Engine
 * Lexical variable interpolation without eval() or new Function().
 * Supports nested dot notation (e.g. {{contact.name}}, {{variables.orderId}}).
 */

export interface TemplateContext {
  contact?: {
    id?: string;
    name?: string;
    phone?: string;
    pushName?: string;
    customFields?: Record<string, string | number | boolean>;
    [key: string]: unknown;
  };
  message?: {
    id?: string;
    text?: string;
    body?: string;
    type?: string;
    timestamp?: number;
    sender?: string;
    [key: string]: unknown;
  };
  conversation?: {
    id?: string;
    unreadCount?: number;
    [key: string]: unknown;
  };
  workflow?: {
    id?: string;
    name?: string;
    executionId?: string;
    [key: string]: unknown;
  };
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

export class SafeTemplate {
  /**
   * Matches {{variable}} or {{nested.path.value}}
   */
  private static readonly VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

  /**
   * Safely interpolates variables into a template string
   */
  static render(template: string, context: TemplateContext = {}): string {
    if (!template || typeof template !== 'string') {
      return '';
    }

    return template.replace(SafeTemplate.VARIABLE_REGEX, (_match, path: string) => {
      const resolved = SafeTemplate.resolvePath(path.trim(), context);
      if (resolved === null || resolved === undefined) {
        return '';
      }
      if (typeof resolved === 'object') {
        return JSON.stringify(resolved);
      }
      return String(resolved);
    });
  }

  /**
   * Resolves a dotted path (e.g. 'contact.name' or 'variables.orderId') from context
   */
  private static resolvePath(path: string, context: TemplateContext): unknown {
    const parts = path.split('.');

    // 1. Direct path lookup in context
    let current: unknown = context;
    let found = true;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        found = false;
        break;
      }
    }

    if (found && current !== undefined) {
      return current;
    }

    // 2. Check within context.variables directly
    if (context.variables && parts.length === 1 && parts[0] in context.variables) {
      return context.variables[parts[0]];
    }

    // 3. Fallback convenience shortcuts
    if (parts.length === 1) {
      const single = parts[0];
      if (single === 'name' && context.contact?.name) return context.contact.name;
      if (single === 'phone' && context.contact?.phone) return context.contact.phone;
      if (single === 'text' && (context.message?.text || context.message?.body)) {
        return context.message.text || context.message.body;
      }
    }

    // 4. Fallback for custom fields in contact (e.g. {{custom.company}} or {{contact.customFields.company}})
    if (parts[0] === 'custom' && parts.length === 2 && context.contact?.customFields) {
      return context.contact.customFields[parts[1]];
    }

    return '';
  }

  /**
   * Extracts all variable keys referenced in a template string
   */
  static extractVariables(template: string): string[] {
    if (!template) return [];
    const keys = new Set<string>();
    let match: RegExpExecArray | null;
    const regex = new RegExp(SafeTemplate.VARIABLE_REGEX.source, 'g');

    while ((match = regex.exec(template)) !== null) {
      keys.add(match[1].trim());
    }

    return Array.from(keys);
  }
}

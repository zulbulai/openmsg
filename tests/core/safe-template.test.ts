import { describe, it, expect } from 'vitest';
import { SafeTemplate } from '@/core/template/safe-template';

describe('SafeTemplate', () => {
  it('should interpolate contact fields', () => {
    const template = 'Hello {{contact.name}}, your phone is {{contact.phone}}!';
    const result = SafeTemplate.render(template, {
      contact: {
        id: '15551234567@c.us',
        name: 'John Doe',
        phone: '+15551234567',
      },
    });
    expect(result).toBe('Hello John Doe, your phone is +15551234567!');
  });

  it('should interpolate nested variables', () => {
    const template = 'Order #{{variables.orderId}} status: {{variables.status}}';
    const result = SafeTemplate.render(template, {
      variables: {
        orderId: '98765',
        status: 'SHIPPED',
      },
    });
    expect(result).toBe('Order #98765 status: SHIPPED');
  });

  it('should support shorthand name and phone aliases', () => {
    const template = 'Hi {{name}} ({{phone}})';
    const result = SafeTemplate.render(template, {
      contact: { name: 'Sarah', phone: '+123456' },
    });
    expect(result).toBe('Hi Sarah (+123456)');
  });

  it('should support contact custom fields', () => {
    const template = 'Company: {{custom.company}}, Tier: {{custom.tier}}';
    const result = SafeTemplate.render(template, {
      contact: {
        name: 'Bob',
        customFields: {
          company: 'Acme Inc',
          tier: 'Gold',
        },
      },
    });
    expect(result).toBe('Company: Acme Inc, Tier: Gold');
  });

  it('should safely omit undefined variables without error or eval', () => {
    const template = 'Value is: [{{missing.path}}]';
    const result = SafeTemplate.render(template, {});
    expect(result).toBe('Value is: []');
  });

  it('should extract all variable placeholders', () => {
    const template = 'Hello {{contact.name}}, see {{variables.docUrl}} and {{custom.field1}}';
    const vars = SafeTemplate.extractVariables(template);
    expect(vars).toEqual(['contact.name', 'variables.docUrl', 'custom.field1']);
  });
});

import { describe, it, expect } from 'vitest';
import { AutomationService } from '@/core/automation/automation-service';

describe('Chatbot Rule Matcher Unit Tests', () => {
  it('correctly matches exact keyword', () => {
    expect(AutomationService.matchKeyword('hello', 'hello', 'exact')).toBe(true);
    expect(AutomationService.matchKeyword('Hello ', 'hello', 'exact')).toBe(true);
    expect(AutomationService.matchKeyword('hello world', 'hello', 'exact')).toBe(false);
  });

  it('correctly matches contains keyword', () => {
    expect(AutomationService.matchKeyword('What is the price of this product?', 'price', 'contains')).toBe(true);
    expect(AutomationService.matchKeyword('I need help immediately', 'help', 'contains')).toBe(true);
    expect(AutomationService.matchKeyword('Good morning', 'pricing', 'contains')).toBe(false);
  });

  it('correctly matches starts_with keyword', () => {
    expect(AutomationService.matchKeyword('/order 12345', '/order', 'starts_with')).toBe(true);
    expect(AutomationService.matchKeyword('Please /order 12345', '/order', 'starts_with')).toBe(false);
  });

  it('correctly matches safe regex pattern', () => {
    expect(AutomationService.matchKeyword('order #9988', '^order\\s*#?\\d+$', 'regex')).toBe(true);
    expect(AutomationService.matchKeyword('hello world', '^order\\s*#?\\d+$', 'regex')).toBe(false);
  });

  it('gracefully handles invalid regex without throwing', () => {
    expect(AutomationService.matchKeyword('hello', '[invalid(regex', 'regex')).toBe(false);
  });
});

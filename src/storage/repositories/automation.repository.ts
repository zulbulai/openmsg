import { db } from '../db';
import { AutomationRule } from '../schemas';

export class AutomationRepository {
  static async listAll(): Promise<AutomationRule[]> {
    return db.automationRules.toArray();
  }

  static async listEnabledByTrigger(trigger: string): Promise<AutomationRule[]> {
    return db.automationRules
      .where('trigger')
      .equals(trigger)
      .filter((r) => r.enabled)
      .toArray();
  }

  static async upsert(rule: AutomationRule): Promise<AutomationRule> {
    await db.automationRules.put(rule);
    return rule;
  }

  static async delete(id: string): Promise<void> {
    await db.automationRules.delete(id);
  }
}

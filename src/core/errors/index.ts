/**
 * OpenMsg Centralized Error System
 * Standardized error classes for predictable error handling across subsystems.
 */

export abstract class OpenMsgError extends Error {
  abstract readonly code: string;
  readonly timestamp: number = Date.now();
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Safe user-facing error message without technical internal traces
   */
  toUserMessage(): string {
    return this.message;
  }
}

export class WhatsAppError extends OpenMsgError {
  readonly code = 'ERR_WHATSAPP';
}

export class StorageError extends OpenMsgError {
  readonly code = 'ERR_STORAGE';
}

export class WorkflowError extends OpenMsgError {
  readonly code = 'ERR_WORKFLOW';
}

export class AutomationError extends OpenMsgError {
  readonly code = 'ERR_AUTOMATION';
}

export class SchedulerError extends OpenMsgError {
  readonly code = 'ERR_SCHEDULER';
}

export class ValidationError extends OpenMsgError {
  readonly code = 'ERR_VALIDATION';
}

export class NetworkError extends OpenMsgError {
  readonly code = 'ERR_NETWORK';
}

export class PermissionError extends OpenMsgError {
  readonly code = 'ERR_PERMISSION';
}

export class RateLimitError extends OpenMsgError {
  readonly code = 'ERR_RATE_LIMIT';
}

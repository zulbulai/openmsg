export interface WorkflowExecutionContext {
  executionId: string;
  workflowId: string;
  contactId: string;
  variables: Record<string, unknown>;
  currentNodeId: string;
  status: 'PENDING' | 'RUNNING' | 'WAITING' | 'WAITING_DELAY' | 'WAITING_INPUT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  resumeAt?: number;
  error?: string;
  logs: string[];
}

export interface StepResult {
  status: 'CONTINUE' | 'WAITING' | 'WAITING_DELAY' | 'WAITING_INPUT' | 'COMPLETED' | 'FAILED';
  nextNodeId?: string;
  resumeAt?: number;
  error?: string;
}

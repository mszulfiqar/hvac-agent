
export type WorkflowExecutionStatus =
  | "waiting"
  | "running"
  | "success"
  | "error"
  | "cancelled";

export type WorkflowEventType =
  | "lead_received"
  | "lead_validated"
  | "ai_started"
  | "ai_completed"
  | "lead_qualified"
  | "sms_queued"
  | "sms_sent"
  | "sms_delivered"
  | "human_handoff"
  | "conversation_reassigned"
  | "workflow_completed"
  | "workflow_failed";

export interface WorkflowExecution {
  id: string;

  // n8n references
  n8nExecutionId: string;
  workflowId: string;
  workflowName: string;

  // Related records
  leadId?: string;
  conversationId?: string;

  // Execution information
  status: WorkflowExecutionStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;

  // Error information
  errorMessage?: string;
  failedNode?: string;

  // Retry information
  retryCount: number;
  maxRetries?: number;

  createdAt: string;
  updatedAt: string;
}

export interface WorkflowEvent {
  id: string;

  executionId: string;

  type: WorkflowEventType;

  message: string;

  leadId?: string;
  conversationId?: string;

  nodeName?: string;

  metadata?: Record<string, unknown>;

  createdAt: string;
}

export interface WorkflowListResponse {
  success: boolean;
  data: WorkflowExecution[];
  total: number;
  page: number;
  limit: number;
}

export interface WorkflowDetailResponse {
  success: boolean;
  data: WorkflowExecution;
  events: WorkflowEvent[];
}

export interface WorkflowExecutionSummary {
  total: number;
  running: number;
  successful: number;
  failed: number;
  waiting: number;
  cancelled: number;
}

export interface WorkflowWebhookEvent {
  eventId: string;

  eventType: WorkflowEventType;

  workflowId: string;
  workflowName: string;

  executionId: string;

  leadId?: string;
  conversationId?: string;

  timestamp: string;

  data?: Record<string, unknown>;
}

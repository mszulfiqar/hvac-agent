
export type LeadUrgency =
  | "emergency"
  | "urgent"
  | "normal"
  | "flexible"
  | "unknown";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "booking_pending"
  | "booked"
  | "disqualified"
  | "closed";

export type LeadSource =
  | "website"
  | "phone"
  | "sms"
  | "google"
  | "facebook"
  | "referral"
  | "manual"
  | "other";

export type AIQualificationStatus =
  | "pending"
  | "processing"
  | "qualified"
  | "needs_information"
  | "disqualified"
  | "failed";

export type WorkflowStatus =
  | "received"
  | "processing"
  | "completed"
  | "failed";

export interface Lead {
  id: string;

  // Customer information
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceAddress?: string;

  // HVAC service information
  requestedService?: string;
  issueDescription: string;
  equipment?: string;

  // AI qualification
  urgency: LeadUrgency;
  qualificationStatus: AIQualificationStatus;
  qualificationSummary?: string;
  missingInformation?: string[];

  // Lead management
  status: LeadStatus;
  source: LeadSource;

  // n8n workflow tracking
  workflowStatus: WorkflowStatus;
  workflowExecutionId?: string;
  lastWorkflowRunAt?: string;

  // Ownership and timestamps
  assignedTo?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListResponse {
  success: boolean;
  data: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadDetailResponse {
  success: boolean;
  data: Lead;
}


export type ConversationOwnership =
  | "ai"
  | "human"
  | "closed";

export interface ConversationOwnershipInfo {
  ownership: ConversationOwnership;
  assignedTo?: string;
  takenOverAt?: string;
  returnedToAIAt?: string;
  closedAt?: string;
}

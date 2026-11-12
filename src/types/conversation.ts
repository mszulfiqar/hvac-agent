
export type ConversationOwnership =
  | "ai"
  | "human"
  | "closed";

export type MessageRole =
  | "customer"
  | "assistant"
  | "staff"
  | "system";

export type MessageDirection =
  | "inbound"
  | "outbound"
  | "internal";

export type MessageDeliveryStatus =
  | "pending"
  | "sending"
  | "sent"
  | "delivered"
  | "failed";

export type HandoffReason =
  | "customer_requested"
  | "ai_escalation"
  | "emergency"
  | "staff_takeover"
  | "other";

export interface ConversationMessage {
  id: string;
  conversationId: string;

  role: MessageRole;
  direction: MessageDirection;

  content: string;

  deliveryStatus?: MessageDeliveryStatus;

  senderId?: string;
  senderName?: string;

  providerMessageId?: string;

  createdAt: string;
  sentAt?: string;
}

export interface ConversationOwnershipInfo {
  ownership: ConversationOwnership;

  assignedTo?: string;
  assignedToName?: string;

  handoffReason?: HandoffReason;

  takenOverAt?: string;
  returnedToAIAt?: string;
  closedAt?: string;
  reopenedAt?: string;
}

export interface Conversation {
  id: string;

  leadId: string;
  customerId?: string;

  customerName: string;
  customerPhone: string;

  channel: "sms" | "phone" | "email" | "other";

  ownership: ConversationOwnershipInfo;

  lastMessage?: string;
  lastMessageAt?: string;

  unreadCount: number;

  branchId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetailResponse {
  success: boolean;
  data: Conversation;
  messages: ConversationMessage[];
}

export interface ConversationListResponse {
  success: boolean;
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface TakeoverConversationInput {
  conversationId: string;
  staffId: string;
  reason: HandoffReason;
}

export interface ReturnConversationToAIInput {
  conversationId: string;
  staffId: string;
}

export interface SendConversationMessageInput {
  conversationId: string;
  content: string;
}

export interface UpdateConversationOwnershipInput {
  conversationId: string;
  ownership: ConversationOwnership;
}

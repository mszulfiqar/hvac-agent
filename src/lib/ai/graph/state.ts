import { Annotation } from "@langchain/langgraph";

export type JevClassification = {
  category?: string;
  urgency?: string;
  intent?: string;
  spam?: string;
  reason?: string;
  raw?: unknown;
};

export const AgentState = Annotation.Root({
  companyId: Annotation<string>(),
  leadId: Annotation<string>(),
  conversationId: Annotation<string>(),
  messageId: Annotation<string>(),
  inboundText: Annotation<string>(),
  classification: Annotation<JevClassification | null>(),
});

export type AgentStateType = typeof AgentState.State;

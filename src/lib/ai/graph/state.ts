import { Annotation } from "@langchain/langgraph";

export type JevClassification = {
  category?: string;
  urgent?: boolean | string;
  intent?: string;
  spam?: boolean | string;
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

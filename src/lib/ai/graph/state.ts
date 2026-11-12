import { Annotation } from "@langchain/langgraph";
import type { classifyInboundMessage } from "@/lib/ai/jev";

export type JevClassification = Awaited<
  ReturnType<typeof classifyInboundMessage>
>;

export const AgentState = Annotation.Root({
  companyId: Annotation<string>(),
  leadId: Annotation<string>(),
  conversationId: Annotation<string>(),
  messageId: Annotation<string>(),
  inboundText: Annotation<string>(),
  classification: Annotation<JevClassification | null>(),
});

export type AgentStateType = typeof AgentState.State;

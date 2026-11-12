import { Annotation } from "@langchain/langgraph";
import type { classifyInboundMessage } from "@/lib/ai/jev";

export type JevClassification = Awaited<
  ReturnType<typeof classifyInboundMessage>
>;

export type AiQualification = {
  serviceType: string | null;
  urgency: string;
  customerIntent: string;
  summary: string;
  leadScore: number;
  bant: {
    budget: { value: string | null; notes: string | null; confirmed: boolean };
    authority: { value: string | null; notes: string | null; confirmed: boolean };
    need: { value: string | null; notes: string | null; confirmed: boolean };
    timeline: { value: string | null; notes: string | null; confirmed: boolean };
    missingInformation: string[];
  };
};

export const AgentState = Annotation.Root({
  companyId: Annotation<string>(),
  leadId: Annotation<string>(),
  conversationId: Annotation<string>(),
  messageId: Annotation<string>(),
  inboundText: Annotation<string>(),
  customerName: Annotation<string>(),
  leadTitle: Annotation<string | null>(),
  serviceType: Annotation<string | null>(),
  serviceZipCode: Annotation<string | null>(),
  previousQualification: Annotation<string>(),
  conversationHistory: Annotation<string>(),
  classification: Annotation<JevClassification | null>(),
  disposition: Annotation<"continue" | "spam" | "unqualified">(),
  qualification: Annotation<AiQualification | null>(),
  replyDraft: Annotation<string | null>(),
});

export type AgentStateType = typeof AgentState.State;

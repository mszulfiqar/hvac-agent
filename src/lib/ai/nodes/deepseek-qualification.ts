import { z } from "zod";

import { getChatModel } from "@/lib/ai/model";
import type { AgentStateType, AiQualification } from "@/lib/ai/graph/state";

const qualificationSchema = z.object({
  serviceType: z.string().nullable(),
  urgency: z.enum(["emergency", "urgent", "normal", "flexible", "unknown"]),
  customerIntent: z.string(),
  summary: z.string(),
  leadScore: z.number().int().min(0).max(100),
  bant: z.object({
    budget: z.object({
      value: z.string().nullable(),
      notes: z.string().nullable(),
      confirmed: z.boolean(),
    }),
    authority: z.object({
      value: z.string().nullable(),
      notes: z.string().nullable(),
      confirmed: z.boolean(),
    }),
    need: z.object({
      value: z.string().nullable(),
      notes: z.string().nullable(),
      confirmed: z.boolean(),
    }),
    timeline: z.object({
      value: z.string().nullable(),
      notes: z.string().nullable(),
      confirmed: z.boolean(),
    }),
    missingInformation: z.array(z.string()),
  }),
});

export async function deepseekQualificationNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!state.classification) throw new Error("Jev classification is required.");

  const model = getChatModel().withStructuredOutput(qualificationSchema);
  const qualification = (await model.invoke([
    {
      role: "system",
      content:
        "You qualify HVAC service leads. Use only evidence in the conversation. Never invent budget, authority, dates, equipment facts, or customer commitments. Keep unknown BANT values null and list useful missing information. Score commercial readiness from 0 to 100; do not treat urgency alone as a high score. Return a concise factual summary.",
    },
    {
      role: "user",
      content: JSON.stringify({
        latestMessage: state.inboundText,
        classification: state.classification,
        knownLeadTitle: state.leadTitle,
        knownServiceType: state.serviceType,
        serviceZipCode: state.serviceZipCode,
        previousQualification: state.previousQualification,
        conversationHistory: state.conversationHistory,
      }),
    },
  ])) as AiQualification;

  return { qualification };
}

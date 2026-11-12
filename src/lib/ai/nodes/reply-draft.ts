import { getChatModel } from "@/lib/ai/model";
import type { AgentStateType } from "@/lib/ai/graph/state";

export async function replyDraftNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!state.qualification) throw new Error("Lead qualification is required.");

  const response = await getChatModel().invoke([
    {
      role: "system",
      content:
        "Write one concise, natural SMS reply for an HVAC company. Acknowledge the customer's latest message, ask only the single most useful unanswered question, and do not claim an appointment is booked, a technician is dispatched, a price is confirmed, or an action has happened. Do not include a greeting if the conversation already has one. Output only the SMS text.",
    },
    {
      role: "user",
      content: JSON.stringify({
        customerName: state.customerName,
        latestMessage: state.inboundText,
        classification: state.classification,
        qualification: state.qualification,
        conversationHistory: state.conversationHistory,
      }),
    },
  ]);

  const draft =
    typeof response.content === "string"
      ? response.content.trim()
      : JSON.stringify(response.content).trim();

  if (!draft) throw new Error("DeepSeek returned an empty SMS draft.");

  return { replyDraft: draft };
}

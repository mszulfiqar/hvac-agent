import { classifyInboundMessage } from "@/lib/ai/jev";
import type { AgentStateType } from "@/lib/ai/graph/state";

export async function jevClassificationNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!state.inboundText?.trim()) {
    throw new Error("Jev classification requires a non-empty inbound message.");
  }

  const classification = await classifyInboundMessage(state.inboundText);

  return { classification };
}

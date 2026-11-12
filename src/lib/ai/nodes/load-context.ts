import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { conversations, customers, leads, messages } from "@/db/schema";
import type { AgentStateType } from "@/lib/ai/graph/state";

export async function loadContextNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const [context] = await db
    .select({
      conversationStatus: conversations.status,\n      leadStatus: leads.status,
      handlingMode: conversations.handlingMode,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      leadTitle: leads.title,
      serviceType: leads.serviceType,
      serviceZipCode: leads.serviceZipCode,
      qualificationData: leads.qualificationData,
      qualificationSummary: leads.qualificationSummary,
    })
    .from(conversations)
    .innerJoin(
      leads,
      and(
        eq(conversations.companyId, leads.companyId),
        eq(conversations.leadId, leads.id),
      ),
    )
    .innerJoin(
      customers,
      and(
        eq(leads.companyId, customers.companyId),
        eq(leads.customerId, customers.id),
      ),
    )
    .where(
      and(
        eq(conversations.companyId, state.companyId),
        eq(conversations.id, state.conversationId),
        eq(conversations.leadId, state.leadId),
      ),
    )
    .limit(1);

  if (!context) throw new Error("AI context not found for this tenant.");

  if (context.conversationStatus !== "OPEN" || context.handlingMode !== "AI") {
    return { disposition: "unqualified" };
  }

  const history = await db
    .select({
      direction: messages.direction,
      senderType: messages.senderType,
      content: messages.content,
    })
    .from(messages)
    .where(
      and(
        eq(messages.companyId, state.companyId),
        eq(messages.conversationId, state.conversationId),
      ),
    )
    .orderBy(asc(messages.createdAt))
    .limit(30);

  const customerName = [context.customerFirstName, context.customerLastName]
    .filter(Boolean)
    .join(" ");

  return {
    customerName,
    leadTitle: context.leadTitle,
    serviceType: context.serviceType,
    serviceZipCode: context.serviceZipCode,
    previousQualification: JSON.stringify(context.qualificationData ?? {}),
    conversationHistory: history
      .map((item) => `${item.senderType} (${item.direction}): ${item.content}`)
      .join("\n"),
    disposition: "continue",
  };
}

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { conversations, leads, messages } from "@/db/schema";
import type { AgentStateType } from "@/lib/ai/graph/state";

export async function persistQualificationNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!state.classification) throw new Error("Jev classification is missing.");

  await db.transaction(async (tx) => {
    // Serialize processing for this conversation and recheck ownership
    // immediately before writing AI output.
    const [conversation] = await tx
      .select({
        id: conversations.id,
        status: conversations.status,
        handlingMode: conversations.handlingMode,
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.companyId, state.companyId),
          eq(conversations.id, state.conversationId),
          eq(conversations.leadId, state.leadId),
        ),
      )
      .for("update")
      .limit(1);

    if (
      !conversation ||
      conversation.status !== "OPEN" ||
      conversation.handlingMode !== "AI"
    ) {
      return;
    }

    const isSpam = state.disposition === "spam";
    const isUnqualified = state.disposition === "unqualified";

    if (isSpam || isUnqualified) {
      await tx
        .update(leads)
        .set({
          status: isSpam ? "SPAM" : "UNQUALIFIED",
          isSpam,
          spamReason: isSpam
            ? `Jev classified message as spam (category: ${String(state.classification.category)}).`
            : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leads.companyId, state.companyId),
            eq(leads.id, state.leadId),
          ),
        );
      return;
    }

    if (!state.qualification || !state.replyDraft) {
      throw new Error("Qualification and reply draft are required.");
    }

    // Inngest may retry a completed step after a transient failure.
    // Check the source message marker while holding the conversation lock.
    const [existingDraft] = await tx
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.companyId, state.companyId),
          eq(messages.conversationId, state.conversationId),
          eq(messages.senderType, "AI"),
          sql`${messages.metadata}->>'sourceMessageId' = ${state.messageId}`,
        ),
      )
      .limit(1);

    if (existingDraft) return;

    const qualification = state.qualification;
    const confidenceValues = [
      Number(state.classification.categoryConfidence),
      Number(state.classification.urgencyConfidence),
      Number(state.classification.intentConfidence),
    ].filter(Number.isFinite);
    const aiConfidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) /
        confidenceValues.length
      : undefined;

    await tx
      .update(leads)
      .set({
        status:
          qualification.leadScore >= 70 && qualification.bant.need.confirmed
            ? "QUALIFIED"
            : "TRIAGED",
        serviceType: qualification.serviceType ?? undefined,
        leadScore: qualification.leadScore,
        qualificationSummary: qualification.summary,
        qualificationData: {
          bant: qualification.bant,
          serviceType: qualification.serviceType ?? undefined,
          urgency: qualification.urgency,
          customerIntent: qualification.customerIntent,
          aiConfidence,
          additionalNotes: `Jev category: ${String(state.classification.category)}; intent: ${String(state.classification.intent)}.`,
        },
        aiQualifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leads.companyId, state.companyId),
          eq(leads.id, state.leadId),
        ),
      );

    await tx.insert(messages).values({
      companyId: state.companyId,
      conversationId: state.conversationId,
      direction: "OUTBOUND",
      senderType: "AI",
      content: state.replyDraft,
      deliveryStatus: "QUEUED",
      approvalStatus: "PENDING",
      metadata: {
        isDraft: true,
        sourceMessageId: state.messageId,
        generatedBy: "speed-to-lead-agent",
        classification: {
          category: state.classification.category,
          urgency: state.classification.urgency,
          intent: state.classification.intent,
          spam: state.classification.spam,
        },
      },
    });
  });

  return {};
}

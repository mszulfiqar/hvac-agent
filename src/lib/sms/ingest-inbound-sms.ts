
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  companies,
  customers,
  leads,
  conversations,
  messages,
} from "@/db/schema";
import { inngest } from "@/inngest/client";

type InboundSmsInput = {
  providerMessageId: string;
  from: string;
  to: string;
  text: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export async function ingestInboundSms(input: InboundSmsInput) {
  const from = normalizePhone(input.from);
  const to = normalizePhone(input.to);
  const receivedAt = new Date();

  if (!from || !to || !input.providerMessageId.trim()) {
    throw new Error("Invalid inbound SMS details.");
  }

  if (!input.text.trim()) {
    throw new Error("SMS message text is empty.");
  }

  const result = await db.transaction(async (tx) => {
    // Identify the HVAC company by its receiving phone number.
    const [company] = await tx
      .select()
      .from(companies)
      .where(eq(companies.phone, to))
      .limit(1);

    if (!company || company.status !== "ACTIVE") {
      throw new Error("No active company is configured for this number.");
    }

    // Match the customer inside this company.
    const [customer] = await tx
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.companyId, company.id),
          eq(customers.phone, from),
        ),
      )
      .limit(1);

    if (!customer) {
      throw new Error(
        "Customer not found. This first test supports the seeded customer only.",
      );
    }

    // Use the customer's most recently updated lead.
    const [lead] = await tx
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.companyId, company.id),
          eq(leads.customerId, customer.id),
        ),
      )
      .orderBy(desc(leads.createdAt))
      .limit(1);

    if (!lead) {
      throw new Error("No lead found for this customer.");
    }

    // Find the existing SMS conversation for this lead.
    const [conversation] = await tx
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.companyId, company.id),
          eq(conversations.leadId, lead.id),
          eq(conversations.channel, "SMS"),
        ),
      )
      .limit(1);

    if (!conversation) {
      throw new Error("No SMS conversation found for this lead.");
    }

    // Check provider message ID before inserting.
    const [existingMessage] = await tx
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.companyId, company.id),
          eq(messages.provider, "telnyx"),
          eq(messages.providerMessageId, input.providerMessageId),
        ),
      )
      .limit(1);

    if (existingMessage) {
      return {
        companyId: company.id,
        customerId: customer.id,
        leadId: lead.id,
        conversationId: conversation.id,
        messageId: existingMessage.id,
        duplicate: true,
      };
    }

    // Save the inbound SMS. The unique constraint on the provider
    // message ID protects against simultaneous duplicate deliveries.
    const [insertedMessage] = await tx
      .insert(messages)
      .values({
        companyId: company.id,
        conversationId: conversation.id,
        direction: "INBOUND",
        senderType: "CUSTOMER",
        content: input.text.trim(),
        deliveryStatus: "RECEIVED",
        approvalStatus: "NOT_REQUIRED",
        provider: "telnyx",
        providerMessageId: input.providerMessageId,
        metadata: {
          source: "telnyx",
          receivedAt: receivedAt.toISOString(),
        },
      })
      .onConflictDoNothing()
      .returning();

    if (!insertedMessage) {
      // A concurrent request may have inserted this message first.
      const [duplicateMessage] = await tx
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.companyId, company.id),
            eq(messages.provider, "telnyx"),
            eq(messages.providerMessageId, input.providerMessageId),
          ),
        )
        .limit(1);

      if (!duplicateMessage) {
        throw new Error("Could not save or retrieve the inbound message.");
      }

      return {
        companyId: company.id,
        customerId: customer.id,
        leadId: lead.id,
        conversationId: conversation.id,
        messageId: duplicateMessage.id,
        duplicate: true,
      };
    }

    await tx
      .update(conversations)
      .set({
        lastMessageAt: receivedAt,
        updatedAt: receivedAt,
      })
      .where(eq(conversations.id, conversation.id));

    return {
      companyId: company.id,
      customerId: customer.id,
      leadId: lead.id,
      conversationId: conversation.id,
      messageId: insertedMessage.id,
      duplicate: false,
    };
  });

  // Dispatch after the database transaction commits.
  // If dispatch fails, the request fails; replaying the same webhook
  // will find the saved message and attempt dispatch again.
  await inngest.send({
    id: `telnyx-${input.providerMessageId}`,
    name: "sms/received",
    data: {
      ...result,
      provider: "telnyx",
      from,
      to,
      text: input.text.trim(),
    },
  });

  return result;
}

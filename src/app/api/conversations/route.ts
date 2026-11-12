
import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
    companies,
    conversations,
    leads,
    customers,
    customerAddresses,
    messages,
} from "@/db/schema";

function formatLeadStatus(status: string, conversationStatus: string) {
    if (conversationStatus === "CLOSED") return "Closed";

    switch (status) {
        case "NEW":
            return "New";
        case "QUALIFIED":
            return "Qualified";
        case "BOOKED":
            return "Booked";
        case "LOST":
        case "SPAM":
            return "Closed";
        default:
            return "Needs attention";
    }
}

function formatSender(senderType: string) {
    switch (senderType) {
        case "CUSTOMER":
            return "customer";
        case "AI":
            return "ai";
        default:
            return "dispatcher";
    }
}

function getInitials(
    firstName: string | null,
    lastName: string | null,
) {
    const first = firstName?.trim().charAt(0) ?? "";
    const last = lastName?.trim().charAt(0) ?? "";

    return `${first}${last}`.toUpperCase() || "CU";
}

export async function GET() {
    try {
        // Temporary local-demo tenant selection.
        // Production must resolve this from the authenticated user's tenant.
        const [company] = await db
            .select({
                id: companies.id,
                name: companies.name,
            })
            .from(companies)
            .where(
                and(
                    eq(companies.slug, "demo-hvac-services"),
                    eq(companies.status, "ACTIVE"),
                ),
            )
            .limit(1);

        if (!company) {
            return NextResponse.json(
                { error: "Demo company not found or inactive." },
                { status: 404 },
            );
        }

        const rows = await db
            .select({
                conversationId: conversations.id,
                conversationStatus: conversations.status,
                handlingMode: conversations.handlingMode,
                channel: conversations.channel,
                lastMessageAt: conversations.lastMessageAt,

                leadId: leads.id,
                leadStatus: leads.status,
                leadTitle: leads.title,
                serviceType: leads.serviceType,
                leadSource: leads.source,
                urgency: leads.qualificationData,

                customerId: customers.id,
                firstName: customers.firstName,
                lastName: customers.lastName,
                phone: customers.phone,

                addressLine1: customerAddresses.addressLine1,
                addressLine2: customerAddresses.addressLine2,
                city: customerAddresses.city,
                state: customerAddresses.state,
                zipCode: customerAddresses.zipCode,
            })
            .from(conversations)
            .innerJoin(
                leads,
                and(
                    eq(conversations.leadId, leads.id),
                    eq(conversations.companyId, leads.companyId),
                ),
            )
            .innerJoin(
                customers,
                and(
                    eq(leads.customerId, customers.id),
                    eq(leads.companyId, customers.companyId),
                ),
            )
            .leftJoin(
                customerAddresses,
                and(
                    eq(leads.serviceAddressId, customerAddresses.id),
                    eq(leads.companyId, customerAddresses.companyId),
                    eq(leads.customerId, customerAddresses.customerId),
                ),
            )
            .where(eq(conversations.companyId, company.id))
            .orderBy(desc(conversations.lastMessageAt));

        if (rows.length === 0) {
            return NextResponse.json({
                success: true,
                conversations: [],
            });
        }

        const conversationIds = rows.map((row) => row.conversationId);

        const allMessages = await db
            .select({
                id: messages.id,
                conversationId: messages.conversationId,
                senderType: messages.senderType,
                direction: messages.direction,
                content: messages.content,
                createdAt: messages.createdAt,
                deliveryStatus: messages.deliveryStatus,
                approvalStatus: messages.approvalStatus,
            })
            .from(messages)
            .where(
                and(
                    eq(messages.companyId, company.id),
                    inArray(messages.conversationId, conversationIds),
                ),
            )
            .orderBy(messages.createdAt);

        const messagesByConversation = new Map<
            string,
            typeof allMessages
        >();

        for (const message of allMessages) {
            const existing =
                messagesByConversation.get(message.conversationId) ?? [];

            existing.push(message);
            messagesByConversation.set(message.conversationId, existing);
        }

        const result = rows.map((row) => {
            const customerName = [
                row.firstName,
                row.lastName,
            ]
                .filter(Boolean)
                .join(" ") || "Unknown customer";

            const conversationMessages =
                messagesByConversation.get(row.conversationId) ?? [];

            const latestMessage = conversationMessages.at(-1);

            const address = [
                row.addressLine1,
                row.addressLine2,
                row.city,
                row.state,
                row.zipCode,
            ]
                .filter(Boolean)
                .join(", ");

            const owner =
                row.conversationStatus === "CLOSED"
                    ? "Closed"
                    : row.handlingMode === "HUMAN"
                        ? "Human"
                        : "AI";

            const urgency =
                row.urgency &&
                    typeof row.urgency === "object" &&
                    "urgency" in row.urgency
                    ? String(row.urgency.urgency ?? "Normal")
                    : "Normal";

            return {
                id: row.conversationId,
                leadId: row.leadId,
                customerId: row.customerId,
                name: customerName,
                phone: row.phone ?? "",
                initials: getInitials(row.firstName, row.lastName),
                preview: latestMessage?.content ?? row.leadTitle ?? "",
                updated: row.lastMessageAt?.toISOString() ?? null,
                status: formatLeadStatus(
                    row.leadStatus,
                    row.conversationStatus,
                ),
                owner,
                service: row.serviceType ?? "Not specified",
                address: address || "Address not provided",
                urgency,
                source: row.leadSource,
                channel: row.channel,
                messages: conversationMessages.map((message) => ({
                    id: message.id,
                    sender: formatSender(message.senderType),
                    text: message.content,
                    time: message.createdAt.toISOString(),
                    deliveryStatus: message.deliveryStatus,
                    approvalStatus: message.approvalStatus,
                    direction: message.direction,
                })),
            };
        });

        return NextResponse.json({
            success: true,
            conversations: result,
        });
    } catch (error) {
        console.error("GET /api/conversations error:", error);

        return NextResponse.json(
            { error: "Failed to load conversations." },
            { status: 500 },
        );
    }
}

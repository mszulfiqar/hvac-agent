
import { db, pool } from "./index";

import {
  companies,
  companyServiceZipCodes,
  customers,
  customerAddresses,
  leads,
  conversations,
  messages,
} from "./schema";

import type { LeadQualificationData } from "./schema";

// ============================================================
// STABLE SEED IDs
// Re-running the seed updates the same demo records.
// ============================================================

const IDS = {
  company: "10000000-0000-4000-8000-000000000001",

  zipAustin1: "20000000-0000-4000-8000-000000000001",
  zipAustin2: "20000000-0000-4000-8000-000000000002",
  zipAustin3: "20000000-0000-4000-8000-000000000003",

  customer: "30000000-0000-4000-8000-000000000001",

  address: "40000000-0000-4000-8000-000000000001",

  lead: "50000000-0000-4000-8000-000000000001",

  conversation: "60000000-0000-4000-8000-000000000001",

  inboundMessage: "70000000-0000-4000-8000-000000000001",
  aiDraftMessage: "70000000-0000-4000-8000-000000000002",
};

// ============================================================
// SHARED QUALIFICATION DATA
// missingInformation belongs inside bant.
// ============================================================

const demoQualificationData: LeadQualificationData = {
  serviceType: "Air Conditioning Repair",
  urgency: "HIGH",
  customerIntent: "Requesting HVAC repair",
  aiConfidence: 0,
  additionalNotes: "Awaiting AI qualification.",

  bant: {
    need: {
      value: "AC not cooling",
      confirmed: true,
    },

    missingInformation: [
      "Budget",
      "Decision-making authority",
      "Preferred service timeline",
    ],
  },
};

// ============================================================
// SEED FUNCTION
// ============================================================

async function seed() {
  console.log("Starting HVAC platform database seed...");

  await db.transaction(async (tx) => {
    const now = new Date();

    // --------------------------------------------------------
    // 1. COMPANY
    // --------------------------------------------------------

    await tx
      .insert(companies)
      .values({
        id: IDS.company,
        name: "Demo HVAC Services",
        slug: "demo-hvac-services",
        legalName: "Demo HVAC Services LLC",
        email: "demo@example.com",
        phone: "+15555550100",
        website: "https://example.com",
        timezone: "America/Chicago",
        status: "ACTIVE",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: companies.id,
        set: {
          name: "Demo HVAC Services",
          slug: "demo-hvac-services",
          legalName: "Demo HVAC Services LLC",
          email: "demo@example.com",
          phone: "+15555550100",
          website: "https://example.com",
          timezone: "America/Chicago",
          status: "ACTIVE",
          updatedAt: now,
        },
      });

    console.log("Company seeded.");

    // --------------------------------------------------------
    // 2. COMPANY SERVICE ZIP CODES
    // --------------------------------------------------------

    const zipCodes = [
      {
        id: IDS.zipAustin1,
        zipCode: "78701",
        city: "Austin",
        state: "Texas",
      },
      {
        id: IDS.zipAustin2,
        zipCode: "78702",
        city: "Austin",
        state: "Texas",
      },
      {
        id: IDS.zipAustin3,
        zipCode: "78704",
        city: "Austin",
        state: "Texas",
      },
    ];

    for (const zip of zipCodes) {
      await tx
        .insert(companyServiceZipCodes)
        .values({
          id: zip.id,
          companyId: IDS.company,
          zipCode: zip.zipCode,
          city: zip.city,
          state: zip.state,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: companyServiceZipCodes.id,
          set: {
            companyId: IDS.company,
            zipCode: zip.zipCode,
            city: zip.city,
            state: zip.state,
            isActive: true,
          },
        });
    }

    console.log("Service ZIP codes seeded.");

    // --------------------------------------------------------
    // 3. CUSTOMER
    // --------------------------------------------------------

    await tx
      .insert(customers)
      .values({
        id: IDS.customer,
        companyId: IDS.company,
        firstName: "Jordan",
        lastName: "Smith",
        phone: "+15125550123",
        email: "jordan.smith@example.com",
        notes: "Demo customer created by the database seed.",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: customers.id,
        set: {
          companyId: IDS.company,
          firstName: "Jordan",
          lastName: "Smith",
          phone: "+15125550123",
          email: "jordan.smith@example.com",
          notes: "Demo customer created by the database seed.",
          updatedAt: now,
        },
      });

    console.log("Customer seeded.");

    // --------------------------------------------------------
    // 4. CUSTOMER ADDRESS
    // --------------------------------------------------------

    await tx
      .insert(customerAddresses)
      .values({
        id: IDS.address,
        companyId: IDS.company,
        customerId: IDS.customer,
        label: "Home",
        addressLine1: "123 Example Street",
        city: "Austin",
        state: "Texas",
        zipCode: "78701",
        countryCode: "US",
        isPrimary: true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: customerAddresses.id,
        set: {
          companyId: IDS.company,
          customerId: IDS.customer,
          label: "Home",
          addressLine1: "123 Example Street",
          city: "Austin",
          state: "Texas",
          zipCode: "78701",
          countryCode: "US",
          isPrimary: true,
          updatedAt: now,
        },
      });

    console.log("Customer address seeded.");

    // --------------------------------------------------------
    // 5. LEAD
    // --------------------------------------------------------

    await tx
      .insert(leads)
      .values({
        id: IDS.lead,
        companyId: IDS.company,
        customerId: IDS.customer,
        serviceAddressId: IDS.address,

        source: "WEB_FORM",
        status: "NEW",

        title: "Air conditioner not cooling",

        description:
          "Customer reports that the air conditioner has stopped cooling the house.",

        serviceType: "Air Conditioning Repair",
        serviceZipCode: "78701",

        isOutOfArea: false,
        isSpam: false,

        qualificationSummary:
          "New inbound web lead. Customer needs AC repair. Qualification pending.",

        qualificationData: demoQualificationData,

        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: leads.id,
        set: {
          companyId: IDS.company,
          customerId: IDS.customer,
          serviceAddressId: IDS.address,

          source: "WEB_FORM",
          status: "NEW",

          title: "Air conditioner not cooling",

          description:
            "Customer reports that the air conditioner has stopped cooling the house.",

          serviceType: "Air Conditioning Repair",
          serviceZipCode: "78701",

          isOutOfArea: false,
          isSpam: false,

          qualificationSummary:
            "New inbound web lead. Customer needs AC repair. Qualification pending.",

          qualificationData: demoQualificationData,

          updatedAt: now,
        },
      });

    console.log("Lead seeded.");

    // --------------------------------------------------------
    // 6. CONVERSATION
    // --------------------------------------------------------

    await tx
      .insert(conversations)
      .values({
        id: IDS.conversation,
        companyId: IDS.company,
        leadId: IDS.lead,

        channel: "SMS",
        status: "OPEN",
        handlingMode: "AI",

        externalContactId: "+15125550123",

        lastMessageAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: conversations.id,
        set: {
          companyId: IDS.company,
          leadId: IDS.lead,

          channel: "SMS",
          status: "OPEN",
          handlingMode: "AI",

          externalContactId: "+15125550123",

          lastMessageAt: now,
          updatedAt: now,
        },
      });

    console.log("Conversation seeded.");

    // --------------------------------------------------------
    // 7. INBOUND CUSTOMER MESSAGE
    // --------------------------------------------------------

    await tx
      .insert(messages)
      .values({
        id: IDS.inboundMessage,
        companyId: IDS.company,
        conversationId: IDS.conversation,

        direction: "INBOUND",
        senderType: "CUSTOMER",

        content:
          "Hi, my AC stopped cooling today. Can someone help me?",

        deliveryStatus: "RECEIVED",
        approvalStatus: "NOT_REQUIRED",

        metadata: {
          source: "database_seed",
        },
      })
      .onConflictDoUpdate({
        target: messages.id,
        set: {
          companyId: IDS.company,
          conversationId: IDS.conversation,

          direction: "INBOUND",
          senderType: "CUSTOMER",

          content:
            "Hi, my AC stopped cooling today. Can someone help me?",

          deliveryStatus: "RECEIVED",
          approvalStatus: "NOT_REQUIRED",

          metadata: {
            source: "database_seed",
          },
        },
      });

    console.log("Inbound message seeded.");

    // --------------------------------------------------------
    // 8. AI RESPONSE DRAFT
    // This is a draft, not a real outbound SMS.
    // --------------------------------------------------------

    await tx
      .insert(messages)
      .values({
        id: IDS.aiDraftMessage,
        companyId: IDS.company,
        conversationId: IDS.conversation,

        direction: "OUTBOUND",
        senderType: "AI",

        content:
          "Hi Jordan! Thanks for contacting Demo HVAC Services. I'm sorry your AC isn't cooling. Could you tell me whether the system is running but blowing warm air, or whether it isn't turning on at all?",

        deliveryStatus: "QUEUED",
        approvalStatus: "PENDING",

        metadata: {
          source: "database_seed",
          isDraft: true,
          note: "Demo AI response. Requires approval before sending.",
        },
      })
      .onConflictDoUpdate({
        target: messages.id,
        set: {
          companyId: IDS.company,
          conversationId: IDS.conversation,

          direction: "OUTBOUND",
          senderType: "AI",

          content:
            "Hi Jordan! Thanks for contacting Demo HVAC Services. I'm sorry your AC isn't cooling. Could you tell me whether the system is running but blowing warm air, or whether it isn't turning on at all?",

          deliveryStatus: "QUEUED",
          approvalStatus: "PENDING",

          metadata: {
            source: "database_seed",
            isDraft: true,
            note: "Demo AI response. Requires approval before sending.",
          },
        },
      });

    console.log("AI draft message seeded.");
  });

  console.log("");
  console.log("========================================");
  console.log("HVAC DATABASE SEED COMPLETED");
  console.log("========================================");
  console.log("Company: Demo HVAC Services");
  console.log("Slug: demo-hvac-services");
  console.log("Customer: Jordan Smith");
  console.log("Lead: Air conditioner not cooling");
  console.log("Conversation: SMS / AI handling");
  console.log("Messages: 1 inbound + 1 AI draft");
  console.log("AI draft status: PENDING APPROVAL");
  console.log("No outbound SMS was sent.");
}

// ============================================================
// EXECUTION
// ============================================================

seed()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

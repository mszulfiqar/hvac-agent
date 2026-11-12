
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";

// ============================================================
// ENUMS
// ============================================================

export const companyStatusEnum = pgEnum("company_status", [
  "ACTIVE",
  "SUSPENDED",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "TRIAGED",
  "QUALIFIED",
  "UNQUALIFIED",
  "BOOKING_REQUESTED",
  "BOOKED",
  "LOST",
  "SPAM",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "WEB_FORM",
  "INBOUND_SMS",
  "INBOUND_CALL",
  "MANUAL",
  "INTEGRATION",
]);

export const conversationChannelEnum = pgEnum("conversation_channel", [
  "SMS",
  "VOICE",
  "EMAIL",
  "WEB",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "OPEN",
  "CLOSED",
]);

export const conversationHandlingModeEnum = pgEnum(
  "conversation_handling_mode",
  ["AI", "HUMAN"],
);

export const messageDirectionEnum = pgEnum("message_direction", [
  "INBOUND",
  "OUTBOUND",
]);

export const messageSenderTypeEnum = pgEnum("message_sender_type", [
  "CUSTOMER",
  "AI",
  "AGENT",
  "SYSTEM",
]);

export const messageDeliveryStatusEnum = pgEnum("message_delivery_status", [
  "RECEIVED",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
]);

export const messageApprovalStatusEnum = pgEnum("message_approval_status", [
  "NOT_REQUIRED",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

// ============================================================
// SHARED TYPES
// ============================================================

export type BantQualification = {
  budget?: {
    value?: string;
    notes?: string;
    confirmed?: boolean;
  };
  authority?: {
    value?: string;
    notes?: string;
    confirmed?: boolean;
  };
  need?: {
    value?: string;
    notes?: string;
    confirmed?: boolean;
  };
  timeline?: {
    value?: string;
    notes?: string;
    confirmed?: boolean;
  };
  missingInformation?: string[];
};

export type LeadQualificationData = {
  bant?: BantQualification;
  serviceType?: string;
  urgency?: string;
  customerIntent?: string;
  aiConfidence?: number;
  additionalNotes?: string;
};

// ============================================================
// 1. COMPANIES
// Each HVAC business is a separate tenant.
// ============================================================

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 255 }).notNull(),

    slug: varchar("slug", { length: 100 }).notNull(),

    legalName: varchar("legal_name", { length: 255 }),

    email: varchar("email", { length: 255 }),

    phone: varchar("phone", { length: 30 }),

    website: text("website"),

    timezone: varchar("timezone", { length: 100 })
      .notNull()
      .default("UTC"),

    status: companyStatusEnum("status")
      .notNull()
      .default("ACTIVE"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("companies_slug_unique").on(table.slug),
    index("companies_status_idx").on(table.status),
  ],
);

// ============================================================
// 2. COMPANY SERVICE ZIP CODES
// Defines the geographic service coverage of each tenant.
// ============================================================

export const companyServiceZipCodes = pgTable(
  "company_service_zip_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    zipCode: varchar("zip_code", { length: 10 }).notNull(),

    city: varchar("city", { length: 100 }),

    state: varchar("state", { length: 100 }),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("company_service_zip_unique").on(
      table.companyId,
      table.zipCode,
    ),
    index("company_service_zip_lookup_idx").on(
      table.companyId,
      table.zipCode,
      table.isActive,
    ),
  ],
);

// ============================================================
// 3. CUSTOMERS
// Customers are scoped to individual HVAC companies.
// ============================================================

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    firstName: varchar("first_name", { length: 100 }).notNull(),

    lastName: varchar("last_name", { length: 100 }),

    phone: varchar("phone", { length: 30 }),

    email: varchar("email", { length: 255 }),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("customers_company_id_id_unique").on(
      table.companyId,
      table.id,
    ),
    index("customers_company_idx").on(table.companyId),
    index("customers_company_phone_idx").on(
      table.companyId,
      table.phone,
    ),
    index("customers_company_email_idx").on(
      table.companyId,
      table.email,
    ),
  ],
);

// ============================================================
// 4. CUSTOMER ADDRESSES
// A customer can have multiple service addresses.
// ============================================================

export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id").notNull(),

    customerId: uuid("customer_id").notNull(),

    label: varchar("label", { length: 100 }),

    addressLine1: varchar("address_line_1", { length: 255 }).notNull(),

    addressLine2: varchar("address_line_2", { length: 255 }),

    city: varchar("city", { length: 100 }).notNull(),

    state: varchar("state", { length: 100 }).notNull(),

    zipCode: varchar("zip_code", { length: 10 }).notNull(),

    countryCode: varchar("country_code", { length: 2 })
      .notNull()
      .default("US"),

    isPrimary: boolean("is_primary").notNull().default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "customer_addresses_company_customer_fk",
      columns: [table.companyId, table.customerId],
      foreignColumns: [customers.companyId, customers.id],
    }).onDelete("cascade"),

    uniqueIndex("customer_addresses_company_customer_id_unique").on(
      table.companyId,
      table.customerId,
      table.id,
    ),

    index("customer_addresses_customer_idx").on(
      table.companyId,
      table.customerId,
    ),

    index("customer_addresses_zip_idx").on(
      table.companyId,
      table.zipCode,
    ),
  ],
);

// ============================================================
// 5. LEADS
// Central record for incoming HVAC opportunities.
// ============================================================

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    customerId: uuid("customer_id").notNull(),

    serviceAddressId: uuid("service_address_id"),

    source: leadSourceEnum("source").notNull(),

    status: leadStatusEnum("status").notNull().default("NEW"),

    title: varchar("title", { length: 255 }),

    description: text("description"),

    serviceType: varchar("service_type", { length: 100 }),

    serviceZipCode: varchar("service_zip_code", { length: 10 }),

    isOutOfArea: boolean("is_out_of_area").notNull().default(false),

    isSpam: boolean("is_spam").notNull().default(false),

    spamReason: text("spam_reason"),

    leadScore: integer("lead_score"),

    qualificationSummary: text("qualification_summary"),

    qualificationData: jsonb("qualification_data").$type<LeadQualificationData>(),

    aiQualifiedAt: timestamp("ai_qualified_at", {
      withTimezone: true,
    }),

    lastContactedAt: timestamp("last_contacted_at", {
      withTimezone: true,
    }),

    bookedAt: timestamp("booked_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "leads_company_customer_fk",
      columns: [table.companyId, table.customerId],
      foreignColumns: [customers.companyId, customers.id],
    }).onDelete("restrict"),

    foreignKey({
      name: "leads_company_customer_address_fk",
      columns: [
        table.companyId,
        table.customerId,
        table.serviceAddressId,
      ],
      foreignColumns: [
        customerAddresses.companyId,
        customerAddresses.customerId,
        customerAddresses.id,
      ],
    }).onDelete("restrict"),

    uniqueIndex("leads_company_id_id_unique").on(
      table.companyId,
      table.id,
    ),

    index("leads_company_status_created_idx").on(
      table.companyId,
      table.status,
      table.createdAt,
    ),

    index("leads_company_customer_idx").on(
      table.companyId,
      table.customerId,
    ),

    index("leads_company_zip_idx").on(
      table.companyId,
      table.serviceZipCode,
    ),

    index("leads_company_score_idx").on(
      table.companyId,
      table.leadScore,
    ),
  ],
);

// ============================================================
// 6. CONVERSATIONS
// Communication threads connected to leads.
// Includes AI/Human ownership for HITL functionality.
// ============================================================

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    leadId: uuid("lead_id").notNull(),

    channel: conversationChannelEnum("channel").notNull(),

    status: conversationStatusEnum("status")
      .notNull()
      .default("OPEN"),

    handlingMode: conversationHandlingModeEnum("handling_mode")
      .notNull()
      .default("AI"),

    externalContactId: varchar("external_contact_id", { length: 255 }),

    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
    }),

    closedAt: timestamp("closed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "conversations_company_lead_fk",
      columns: [table.companyId, table.leadId],
      foreignColumns: [leads.companyId, leads.id],
    }).onDelete("cascade"),

    uniqueIndex("conversations_company_id_id_unique").on(
      table.companyId,
      table.id,
    ),

    uniqueIndex("conversations_company_lead_channel_unique").on(
      table.companyId,
      table.leadId,
      table.channel,
    ),

    index("conversations_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    index("conversations_company_handling_mode_idx").on(
      table.companyId,
      table.handlingMode,
    ),

    index("conversations_last_message_idx").on(
      table.companyId,
      table.lastMessageAt,
    ),
  ],
);

// ============================================================
// 7. MESSAGES
// Stores inbound messages, AI drafts, approvals and outbound
// communication records.
// ============================================================

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    conversationId: uuid("conversation_id").notNull(),

    direction: messageDirectionEnum("direction").notNull(),

    senderType: messageSenderTypeEnum("sender_type").notNull(),

    content: text("content").notNull(),

    deliveryStatus: messageDeliveryStatusEnum("delivery_status")
      .notNull()
      .default("RECEIVED"),

    approvalStatus: messageApprovalStatusEnum("approval_status")
      .notNull()
      .default("NOT_REQUIRED"),

    provider: varchar("provider", { length: 50 }),

    providerMessageId: varchar("provider_message_id", {
      length: 255,
    }),

    approvedAt: timestamp("approved_at", {
      withTimezone: true,
    }),

    sentAt: timestamp("sent_at", {
      withTimezone: true,
    }),

    deliveredAt: timestamp("delivered_at", {
      withTimezone: true,
    }),

    failedAt: timestamp("failed_at", {
      withTimezone: true,
    }),

    failureReason: text("failure_reason"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "messages_company_conversation_fk",
      columns: [table.companyId, table.conversationId],
      foreignColumns: [conversations.companyId, conversations.id],
    }).onDelete("cascade"),

    uniqueIndex("messages_provider_message_unique")
      .on(table.companyId, table.provider, table.providerMessageId),

    index("messages_conversation_created_idx").on(
      table.companyId,
      table.conversationId,
      table.createdAt,
    ),

    index("messages_company_approval_idx").on(
      table.companyId,
      table.approvalStatus,
    ),

    index("messages_company_delivery_idx").on(
      table.companyId,
      table.deliveryStatus,
    ),
  ],
);

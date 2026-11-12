CREATE TYPE "company_status" AS ENUM('ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "conversation_channel" AS ENUM('SMS', 'VOICE', 'EMAIL', 'WEB');--> statement-breakpoint
CREATE TYPE "conversation_handling_mode" AS ENUM('AI', 'HUMAN');--> statement-breakpoint
CREATE TYPE "conversation_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "lead_source" AS ENUM('WEB_FORM', 'INBOUND_SMS', 'INBOUND_CALL', 'MANUAL', 'INTEGRATION');--> statement-breakpoint
CREATE TYPE "lead_status" AS ENUM('NEW', 'TRIAGED', 'QUALIFIED', 'UNQUALIFIED', 'BOOKING_REQUESTED', 'BOOKED', 'LOST', 'SPAM');--> statement-breakpoint
CREATE TYPE "message_approval_status" AS ENUM('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "message_delivery_status" AS ENUM('RECEIVED', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TYPE "message_direction" AS ENUM('INBOUND', 'OUTBOUND');--> statement-breakpoint
CREATE TYPE "message_sender_type" AS ENUM('CUSTOMER', 'AI', 'AGENT', 'SYSTEM');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"legal_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(30),
	"website" text,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"status" "company_status" DEFAULT 'ACTIVE'::"company_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_service_zip_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"city" varchar(100),
	"state" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"channel" "conversation_channel" NOT NULL,
	"status" "conversation_status" DEFAULT 'OPEN'::"conversation_status" NOT NULL,
	"handling_mode" "conversation_handling_mode" DEFAULT 'AI'::"conversation_handling_mode" NOT NULL,
	"external_contact_id" varchar(255),
	"last_message_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"label" varchar(100),
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"zip_code" varchar(10) NOT NULL,
	"country_code" varchar(2) DEFAULT 'US' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"phone" varchar(30),
	"email" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_address_id" uuid,
	"source" "lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'NEW'::"lead_status" NOT NULL,
	"title" varchar(255),
	"description" text,
	"service_type" varchar(100),
	"service_zip_code" varchar(10),
	"is_out_of_area" boolean DEFAULT false NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"spam_reason" text,
	"lead_score" integer,
	"qualification_summary" text,
	"qualification_data" jsonb,
	"ai_qualified_at" timestamp with time zone,
	"last_contacted_at" timestamp with time zone,
	"booked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" "message_direction" NOT NULL,
	"sender_type" "message_sender_type" NOT NULL,
	"content" text NOT NULL,
	"delivery_status" "message_delivery_status" DEFAULT 'RECEIVED'::"message_delivery_status" NOT NULL,
	"approval_status" "message_approval_status" DEFAULT 'NOT_REQUIRED'::"message_approval_status" NOT NULL,
	"provider" varchar(50),
	"provider_message_id" varchar(255),
	"approved_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_unique" ON "companies" ("slug");--> statement-breakpoint
CREATE INDEX "companies_status_idx" ON "companies" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "company_service_zip_unique" ON "company_service_zip_codes" ("company_id","zip_code");--> statement-breakpoint
CREATE INDEX "company_service_zip_lookup_idx" ON "company_service_zip_codes" ("company_id","zip_code","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_company_id_id_unique" ON "conversations" ("company_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_company_lead_channel_unique" ON "conversations" ("company_id","lead_id","channel");--> statement-breakpoint
CREATE INDEX "conversations_company_status_idx" ON "conversations" ("company_id","status");--> statement-breakpoint
CREATE INDEX "conversations_company_handling_mode_idx" ON "conversations" ("company_id","handling_mode");--> statement-breakpoint
CREATE INDEX "conversations_last_message_idx" ON "conversations" ("company_id","last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_addresses_company_customer_id_unique" ON "customer_addresses" ("company_id","customer_id","id");--> statement-breakpoint
CREATE INDEX "customer_addresses_customer_idx" ON "customer_addresses" ("company_id","customer_id");--> statement-breakpoint
CREATE INDEX "customer_addresses_zip_idx" ON "customer_addresses" ("company_id","zip_code");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_company_id_id_unique" ON "customers" ("company_id","id");--> statement-breakpoint
CREATE INDEX "customers_company_idx" ON "customers" ("company_id");--> statement-breakpoint
CREATE INDEX "customers_company_phone_idx" ON "customers" ("company_id","phone");--> statement-breakpoint
CREATE INDEX "customers_company_email_idx" ON "customers" ("company_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_company_id_id_unique" ON "leads" ("company_id","id");--> statement-breakpoint
CREATE INDEX "leads_company_status_created_idx" ON "leads" ("company_id","status","created_at");--> statement-breakpoint
CREATE INDEX "leads_company_customer_idx" ON "leads" ("company_id","customer_id");--> statement-breakpoint
CREATE INDEX "leads_company_zip_idx" ON "leads" ("company_id","service_zip_code");--> statement-breakpoint
CREATE INDEX "leads_company_score_idx" ON "leads" ("company_id","lead_score");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_provider_message_unique" ON "messages" ("company_id","provider","provider_message_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" ("company_id","conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_company_approval_idx" ON "messages" ("company_id","approval_status");--> statement-breakpoint
CREATE INDEX "messages_company_delivery_idx" ON "messages" ("company_id","delivery_status");--> statement-breakpoint
ALTER TABLE "company_service_zip_codes" ADD CONSTRAINT "company_service_zip_codes_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_lead_fk" FOREIGN KEY ("company_id","lead_id") REFERENCES "leads"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_company_customer_fk" FOREIGN KEY ("company_id","customer_id") REFERENCES "customers"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_customer_fk" FOREIGN KEY ("company_id","customer_id") REFERENCES "customers"("company_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_customer_address_fk" FOREIGN KEY ("company_id","customer_id","service_address_id") REFERENCES "customer_addresses"("company_id","customer_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_company_conversation_fk" FOREIGN KEY ("company_id","conversation_id") REFERENCES "conversations"("company_id","id") ON DELETE CASCADE;
import { speedToLeadGraph } from "@/lib/ai/graph";
import { inngest } from "./client";

export const phase2HealthCheck = inngest.createFunction(
  {
    id: "phase-2-health-check",
    triggers: {
      event: "platform/health.check",
    },
  },
  async ({ event, step }) => {
    return await step.run("verify-event", async () => ({
      success: true,
      message: "Inngest background execution is working.",
      receivedData: event.data,
      processedAt: new Date().toISOString(),
    }));
  },
);

export const handleInboundSms = inngest.createFunction(
  {
    id: "handle-inbound-sms",
    triggers: {
      event: "sms/received",
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const data = event.data;

    // Do not skip events merely because the webhook was a duplicate:
    // a replay may be recovering an event dispatch that previously failed.
    // The stable Inngest event ID and persistence idempotency protect retries.
    const result = await step.run("run-speed-to-lead-agent", async () => {
      const finalState = await speedToLeadGraph.invoke({
        companyId: data.companyId,
        leadId: data.leadId,
        conversationId: data.conversationId,
        messageId: data.messageId,
        inboundText: data.text,
        customerName: "",
        leadTitle: null,
        serviceType: null,
        serviceZipCode: null,
        previousQualification: "{}",
        conversationHistory: "",
        classification: null,
        disposition: "continue",
        qualification: null,
        replyDraft: null,
      });

      return {
        success: true,
        messageId: data.messageId,
        conversationId: data.conversationId,
        disposition: finalState.disposition,
        classification: finalState.classification,
        leadScore: finalState.qualification?.leadScore ?? null,
        draftCreated: Boolean(finalState.replyDraft),
      };
    });

    console.log("Speed-to-Lead agent completed:", result);
    return result;
  },
);

export const inngestFunctions = [
  phase2HealthCheck,
  handleInboundSms,
];

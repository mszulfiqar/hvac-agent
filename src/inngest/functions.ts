
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
  },
  async ({ event, step }) => {
    return await step.run("acknowledge-inbound-sms", async () => {
      console.log("Inbound SMS received by Inngest:", event.data);

      return {
        success: true,
        message: "Inbound SMS event received by Inngest.",
        messageId: event.data.messageId,
        conversationId: event.data.conversationId,
      };
    });
  },
);

export const inngestFunctions = [
  phase2HealthCheck,
  handleInboundSms,
];

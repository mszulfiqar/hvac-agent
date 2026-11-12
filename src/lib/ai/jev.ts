import {
  choice,
  noul,
  TypeSafeClient,
} from "@typesafe-ai/sdk";

const jev = new TypeSafeClient();

export async function testJevConnection() {
  const result = await jev.systemOne({
    state: {
      customerMessage:
        "My air conditioner stopped cooling. I need someone to repair it today.",
    },
    questions: {
      category: choice(
        "What is the main category of this customer message?",
        {
          hvac_repair: null,
          hvac_installation: null,
          maintenance: null,
          unrelated: null,
          spam: null,
        },
      ),
      urgent: noul(
        "Does the customer explicitly communicate an urgent or same-day need?",
      ),
    },
  });

  return result.answers;
}

export async function classifyInboundMessage(customerMessage: string) {
  const message = customerMessage.trim();

  if (!message) {
    throw new Error("Cannot classify an empty customer message.");
  }

  const result = await jev.systemOne({
    state: { customerMessage: message },
    questions: {
      category: choice(
        "Classify the customer's message by its primary subject.",
        {
          hvac_repair: null,
          hvac_installation: null,
          maintenance: null,
          unrelated: null,
          spam: null,
          unclear: null,
        },
      ),
      urgency: choice(
        "Select the urgency explicitly expressed by the customer. Do not infer an emergency without evidence.",
        {
          emergency: null,
          urgent: null,
          normal: null,
          flexible: null,
          unknown: null,
        },
      ),
      intent: choice(
        "What is the customer's primary intent?",
        {
          request_service: null,
          request_information: null,
          schedule_or_reschedule: null,
          provide_information: null,
          follow_up: null,
          unrelated: null,
          unclear: null,
        },
      ),
      spam: choice(
        "Is this message spam or an unsolicited irrelevant message?",
        {
          yes: null,
          no: null,
          uncertain: null,
        },
      ),
      reason: noul(
        "Briefly explain the classification using only evidence in the customer's message.",
      ),
    },
  });

  return result.answers;
}

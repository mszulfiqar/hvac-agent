
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

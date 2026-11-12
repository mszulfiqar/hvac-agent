
import { ChatOpenAI } from "@langchain/openai";

export function getChatModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing.");
  }

  return new ChatOpenAI({
    model: process.env.OPENROUTER_MODEL,
    apiKey,
    temperature: 0.2,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "X-Title": "HVAC Speed-to-Lead",
      },
    },
  });
}

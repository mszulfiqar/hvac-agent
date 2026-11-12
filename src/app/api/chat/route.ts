
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  sessionId: z.string().uuid(),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(4000),
    })
  ).max(30),
});

function extractReply(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const reply = extractReply(item);
      if (reply) return reply;
    }
    return null;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const data = value as Record<string, unknown>;

  // Check common AI Agent response fields first.
  for (const key of ["reply", "output", "text", "response", "message"]) {
    if (typeof data[key] === "string" && data[key].trim()) {
      return data[key].trim();
    }
  }

  // Support nested response formats.
  for (const key of ["data", "body", "result"]) {
    if (data[key] !== undefined) {
      const reply = extractReply(data[key]);
      if (reply) return reply;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL is not configured." },
        { status: 503 }
      );
    }

    const payload = chatSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        {
          error: "Invalid chat request.",
          details: payload.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { message, sessionId, history } = payload.data;

    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message,
        chatInput: message,
        sessionId,
        history,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });

    const raw = await upstream.text();

    console.log("n8n HTTP status:", upstream.status);
    console.log("n8n raw response:", raw);

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: "n8n webhook returned an error.",
          details:
            process.env.NODE_ENV === "development"
              ? raw
              : undefined,
        },
        { status: 502 }
      );
    }

    let result: unknown;

    try {
      result = JSON.parse(raw);
    } catch {
      result = raw;
    }

    const reply = extractReply(result);

    if (!reply) {
      console.error("Could not extract AI reply from n8n:", result);

      return NextResponse.json(
        {
          error: "n8n responded, but no AI reply was found.",
          details:
            process.env.NODE_ENV === "development"
              ? result
              : undefined,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route error:", error);

    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return NextResponse.json(
      {
        error: isTimeout
          ? "The assistant took too long to respond."
          : "Unable to connect to the support assistant.",
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

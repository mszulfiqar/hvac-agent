
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ingestInboundSms } from "@/lib/sms/ingest-inbound-sms";

const telnyxSimulationSchema = z.object({
  data: z.object({
    event_type: z.literal("message.received"),
    id: z.string().min(1),
    payload: z.object({
      id: z.string().min(1),
      from: z.object({
        phone_number: z.string().min(1),
      }),
      to: z
        .array(
          z.object({
            phone_number: z.string().min(1),
          }),
        )
        .min(1),
      text: z.string().min(1),
    }),
  }),
});

export async function POST(request: NextRequest) {
  // This endpoint must never be available in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404 },
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = telnyxSimulationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid simulated Telnyx webhook payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const event = parsed.data.data;

    const result = await ingestInboundSms({
      providerMessageId: event.payload.id,
      from: event.payload.from.phone_number,
      to: event.payload.to[0].phone_number,
      text: event.payload.text,
    });

    return NextResponse.json({
      success: true,
      message: result.duplicate
        ? "Duplicate SMS received. Existing message was reused."
        : "Simulated inbound SMS processed successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Telnyx simulation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process simulated SMS.",
      },
      { status: 500 },
    );
  }
}

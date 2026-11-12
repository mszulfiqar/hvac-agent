
import { NextResponse } from "next/server";
import { getChatModel } from "@/lib/ai/model";
import { testJevConnection } from "@/lib/ai/jev";


export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Development-only endpoint." },
      { status: 404 },
    );
  }

  const [deepseekResult, jevResult] = await Promise.allSettled([
    getChatModel().invoke(
      "Reply with exactly: DeepSeek connection successful.",
    ),
    testJevConnection(),
  ]);

  const deepseek = deepseekResult.status === "fulfilled"
    ? {
        success: true,
        response:
          typeof deepseekResult.value.content === "string"
            ? deepseekResult.value.content
            : JSON.stringify(deepseekResult.value.content),
      }
    : {
        success: false,
        error: String(deepseekResult.reason),
      };

  const jev = jevResult.status === "fulfilled"
    ? {
        success: true,
        answers: jevResult.value,
      }
    : {
        success: false,
        error: String(jevResult.reason),
      };

  const success = deepseek.success && jev.success;

  return NextResponse.json(
    {
      success,
      providers: {
        deepseek,
        jev,
      },
    },
    { status: success ? 200 : 502 },
  );
}

import { NextRequest } from "next/server";
import { openai } from "@/lib/ai/client";
import { characterizePersona } from "@/lib/ai/instructions/characterizePersona";
import { generateArguments } from "@/lib/ai/instructions/generateArguments";

const INSTRUCTIONS = {
  characterizePersona,
  generateArguments,
} as const;

export type InstructionType = keyof typeof INSTRUCTIONS;

export async function POST(req: NextRequest) {
  const { message, instruction = "generateArguments" } = await req.json() as {
    message: string;
    instruction?: InstructionType;
  };

  const systemPrompt = INSTRUCTIONS[instruction] ?? INSTRUCTIONS.generateArguments;

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatInput: message, sessionId }),
  });

  if (!n8nRes.ok || !n8nRes.body) {
    const body = await n8nRes.text();
    return new Response(JSON.stringify({ error: body }), {
      status: n8nRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // N8N streaming returns NDJSON lines, not SSE.
  // Transform each {"type":"item","content":"..."} line into SSE for the client.
  const encoder = new TextEncoder();
  const n8nReader = n8nRes.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await n8nReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "item" && parsed.content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: parsed.content })}\n\n`),
                );
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

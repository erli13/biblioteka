import OpenAI from "openai";
import { NextRequest } from "next/server";

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY ?? "",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const SYSTEM_PROMPT = `You are a helpful library assistant for the Dhaskal Todri high school.
CRITICAL RULE: You MUST reply ONLY in standard Albanian (Shqip). 
VOCABULARY RULE: Always start new conversations by saying "Përshëndetje!". NEVER use "Mirupafshim" (Goodbye) unless the user is explicitly leaving or ending the chat.
Keep your answers short, friendly, and if the user asks a general question, politely steer the conversation back to recommending books.`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Missing message" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (message.length > 1000) {
    return new Response(JSON.stringify({ error: "Message too long" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.NVIDIA_API_KEY) {
    return new Response(
      JSON.stringify({ error: "NVIDIA_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await nvidia.chat.completions.create({
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
          temperature: 0.3,
          stream: true,
          max_tokens: 1024,
        });

        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n[Gabim: Shërbimi nuk është i disponueshëm. Provo përsëri.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}

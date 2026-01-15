import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const messages = body?.messages ?? [];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a League of Legends coach. Give concise, actionable advice focused on climbing, fundamentals, and matchup-specific tips. Ask 1 short follow-up question only if absolutely needed.",
        },
        ...messages,
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: err?.message ?? String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// /api/coach.ts
import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("OpenAI request timed out")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages } = req.body as { messages?: ChatMsg[] };
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages[]" });
    }

    const system: ChatMsg = {
      role: "system",
      content:
        "You are a League of Legends coach. Be concise and practical. Give: (1) win condition, (2) 2-3 fight rules, (3) 1-2 build/rune notes, (4) common mistake to avoid. If Master Yi, mention holding Q for key CC and reset logic. If Volibear top, mention wave plan and R dive windows.",
    };

    const completion = await withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [system, ...messages],
      }),
      25000
    );

    const text = completion.choices?.[0]?.message?.content ?? "No response.";
    return res.status(200).json({ text });
  } catch (err: any) {
    console.error("Coach API failure:", err);
    return res.status(500).json({
      error: "Server error",
      detail: err?.message ?? String(err),
    });
  }
}


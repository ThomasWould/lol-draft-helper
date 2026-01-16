// /api/coach.ts
import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, context } = req.body as { message?: string; context?: any };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message string" });
    }

    // Keep context compact + safe
    const ctx = context ? JSON.stringify(context).slice(0, 9000) : "{}";

    const system = {
      role: "system" as const,
      content: [
        "You are a League of Legends coach.",
        "Be concise, practical, and tailored to the provided app context.",
        "",
        "You will receive APP_CONTEXT containing:",
        "- championKey + championLabel + role",
        "- enemy team list (+ optional enemy top)",
        "- detected traits (tanks/AP/AD/flex/CC/healing + pills)",
        "- the app's recommended items + fight rule",
        "",
        "Rules:",
        "1) Use the app context aggressively—reference enemy champs/traits and the proposed build/fight rule.",
        "2) IMPORTANT: Determine the champion from APP_CONTEXT.championKey and ONLY give advice for that champion.",
        "3) If enemy team is empty/unknown, give a general plan for the champion and ask what enemy champs are showing.",
        "4) Output format (unless the user asks otherwise):",
        "   - WIN CONDITION (1 line)",
        "   - EARLY GAME (2–3 bullets)",
        "   - TEAMFIGHTS (2–3 bullets)",
        "   - BUILD/RUNES TWEAKS (1–2 bullets; only small deltas from the app build unless user asks)",
        "   - COMMON MISTAKE (1 line)",
        "5) If playing Master Yi: mention holding Q for key CC and reset logic.",
        "6) If playing Bel'Veth: emphasize skirmish→objective conversion (Herald/Baron form), and timing your entry (E for burst).",
        "7) If playing Volibear top: mention wave plan and R dive windows.",
        "8) If playing Heimerdinger top: emphasize turret setup before fights, E stun punish windows, and objective zone control (R+Q/R+E usage).",
        "9) Never mention 'JSON' or 'context injection'—just act like you already know the draft.",
        "",
        `APP_CONTEXT: ${ctx}`,
      ].join("\n"),
    };

    const completion = await withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [system, { role: "user", content: message }],
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

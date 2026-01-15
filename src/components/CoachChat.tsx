import { useMemo, useRef, useState } from "react";
import type { DraftTags } from "../recommendations/tags";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

export function CoachChat(props: {
  selected: "masteryi" | "volibear";
  enemyNames: string[];
  enemyTop?: string;
  tags: DraftTags;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Ask me anything. Example: “What’s my win condition?” or “How do I teamfight this comp?”",
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const context = useMemo(
    () => ({
      selected: props.selected,
      enemyNames: props.enemyNames,
      enemyTop: props.enemyTop,
      tags: props.tags,
    }),
    [props.selected, props.enemyNames, props.enemyTop, props.tags]
  );

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/coach.ts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter(m => m.role !== "assistant" || m.content), context }),
      });

      const data = await r.json();
      const reply = typeof data?.text === "string" ? data.text : "No response—try again.";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      // scroll to bottom
      setTimeout(() => {
        listRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
      }, 50);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Error reaching coach API. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="coachFab" type="button" onClick={() => setOpen(true)}>
        Coach
      </button>

      {open && (
        <div className="coachOverlay" onClick={() => setOpen(false)}>
          <div className="coachDrawer" onClick={(e) => e.stopPropagation()}>
            <div className="coachHeader">
              <div>
                <div className="coachTitle">LoL Coach</div>
                <div className="coachSub">
                  {props.selected === "volibear" ? "Volibear Top" : "Master Yi Jungle"} •{" "}
                  {props.enemyNames.length ? `${props.enemyNames.length} enemies` : "no enemy team yet"}
                </div>
              </div>
              <button className="coachClose" type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="coachBody" ref={listRef}>
              {messages.map((m, i) => (
                <div key={i} className={`coachMsg ${m.role}`}>
                  <div className="coachBubble">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="coachMsg assistant">
                  <div className="coachBubble">Thinking…</div>
                </div>
              )}
            </div>

            <div className="coachInputRow">
              <input
                className="coachInput"
                value={input}
                placeholder="Ask for a plan, build tweak, pathing, win-con…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button className="coachSend" type="button" onClick={send} disabled={loading}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

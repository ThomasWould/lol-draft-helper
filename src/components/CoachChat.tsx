// src/components/CoachChat.tsx
import { useRef, useState } from "react";
import type { CoachContext } from "../coach/types";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

export function CoachChat({
  context,
  mode = "dock",
}: {
  context: CoachContext;
  mode?: "dock" | "fab";
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false); // used only in fab mode
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

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });

      const data = await r.json();
      const reply =
        typeof data?.text === "string" ? data.text : "No response—try again.";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

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

  const title =
    context.championKey === "volibear"
      ? "Volibear Top"
      : context.championKey === "heimerdinger"
        ? "Heimerdinger Top"
        : context.championKey === "belveth"
          ? "Bel'Veth Jungle"
          : "Master Yi Jungle";

  const enemyCount = context.enemyTeam?.length ?? 0;

  // (optional) keep FAB mode available
  if (mode === "fab") {
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
                    {title} • {enemyCount ? `${enemyCount} enemies` : "no enemy team yet"}
                    {context.enemyTop ? ` • top: ${context.enemyTop}` : ""}
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

  // Docked mode (default)
  return (
    <div className={`coachDock ${collapsed ? "collapsed" : ""}`}>
      <div className="coachDockHeader">
        <div>
          <div className="coachDockTitle">Coach</div>
          <div className="coachDockSub">
            {title} • {enemyCount ? `${enemyCount} enemies` : "no enemy team yet"}
            {context.enemyTop ? ` • top: ${context.enemyTop}` : ""}
          </div>
        </div>

        <button
          className="coachDockToggle"
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▸" : "▾"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="coachDockBody" ref={listRef}>
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
        </>
      )}
    </div>
  );
}

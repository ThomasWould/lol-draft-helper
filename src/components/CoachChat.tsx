// src/components/CoachChat.tsx
import { useRef, useState } from "react";
import type { CoachContext } from "../coach/types";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type ImageAttachment = {
  id: string;
  name: string;
  dataUrl: string; // resized + compressed data URL
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// Resize/compress in-browser to keep payload reasonable
async function fileToCompressedDataUrl(
  file: File,
  opts: { maxW: number; maxH: number; quality: number }
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(opts.maxW / bitmap.width, opts.maxH / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Use jpeg for better compression; scoreboard readability is usually fine
  return canvas.toDataURL("image/jpeg", opts.quality);
}

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
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

    async function onPickFiles(files: FileList | null) {
    if (!files) return;

    const picked = Array.from(files).slice(0, 3); // cap to 3 images
    const next: ImageAttachment[] = [];

    for (const f of picked) {
      // guard huge originals (still compressed later, but skip absurd sizes)
      if (f.size > 12 * 1024 * 1024) continue;

      const dataUrl = await fileToCompressedDataUrl(f, {
        maxW: 1800,
        maxH: 1800,
        quality: 0.82,
      });

      next.push({ id: uid(), name: f.name, dataUrl });
    }

    setAttachments((prev) => [...prev, ...next].slice(0, 3));
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

    async function send() {
    const text = input.trim();

    // allow image-only sends
    if ((text.length === 0 && attachments.length === 0) || loading) return;

    const userLine =
      text.length > 0
        ? text
        : `📷 Sent ${attachments.length} screenshot${attachments.length === 1 ? "" : "s"} for review.`;

    setMessages((m) => [...m, { role: "user", content: userLine }]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || "Review the attached scoreboard screenshot(s).",
          context,
          images: attachments.map((a) => a.dataUrl), // ✅ NEW
        }),
      });

      const data = await r.json();
      const reply = typeof data?.text === "string" ? data.text : "No response—try again.";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      // clear attachments after successful send
      setAttachments([]);

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
  {/* hidden file input */}
  <input
    ref={fileRef}
    type="file"
    accept="image/*"
    multiple
    style={{ display: "none" }}
    onChange={(e) => onPickFiles(e.target.files)}
  />

  {/* attach button */}
  <button
    className="coachAttach"
    type="button"
    onClick={() => fileRef.current?.click()}
    disabled={loading}
    title="Attach scoreboard screenshot"
  >
    📎
  </button>

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

{/* attachment previews */}
{attachments.length > 0 && (
  <div style={{ padding: "0 12px 12px", display: "flex", gap: 10, flexWrap: "wrap" }}>
    {attachments.map((a) => (
      <div
        key={a.id}
        style={{
          position: "relative",
          width: 76,
          height: 76,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <img
          src={a.dataUrl}
          alt={a.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <button
          type="button"
          onClick={() => removeAttachment(a.id)}
          title="Remove"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.45)",
            color: "white",
            width: 22,
            height: 22,
            borderRadius: 8,
            cursor: "pointer",
            lineHeight: 0,
          }}
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}
        </>
      )}
    </div>
  );
}

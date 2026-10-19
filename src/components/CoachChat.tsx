// src/components/CoachChat.tsx
import { useRef, useState } from "react";
import { Icon } from "./Icon";
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
  opts: { maxW: number; maxH: number; quality: number },
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    opts.maxW / bitmap.width,
    opts.maxH / bitmap.height,
    1,
  );
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // Use jpeg for better compression; scoreboard readability is usually fine
  return canvas.toDataURL("image/jpeg", opts.quality);
}

export function CoachChat({ context }: { context: CoachContext }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  async function onPickFiles(files: FileList | null) {
    if (!files) return;

    setUploadError("");
    const picked = Array.from(files).slice(0, 3);
    const next: ImageAttachment[] = [];

    for (const f of picked) {
      // guard huge originals (still compressed later, but skip absurd sizes)
      if (!f.type.startsWith("image/") || f.size > 12 * 1024 * 1024) {
        setUploadError("Choose an image smaller than 12 MB.");
        continue;
      }

      try {
        const dataUrl = await fileToCompressedDataUrl(f, {
          maxW: 1800,
          maxH: 1800,
          quality: 0.82,
        });

        next.push({ id: uid(), name: f.name, dataUrl });
      } catch {
        setUploadError("This image could not be opened. Try PNG or JPEG.");
      }
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
          images: attachments.map((a) => a.dataUrl),
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!r.ok) throw new Error("Coach unavailable");
      const data = await r.json();
      const reply =
        typeof data?.text === "string" ? data.text : "No response—try again.";

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

  const title = `${context.championLabel} ${context.role}`;

  const enemyCount = context.enemyTeam?.length ?? 0;

  return (
    <div className={`coachDock ${collapsed ? "collapsed" : ""}`}>
      <div className="coachDockHeader">
        <div className="coachHeading">
          <span className="coachMark">
            <Icon name="spark" />
          </span>
          <div>
            <div className="coachDockTitle">Your draft coach</div>
            <div className="coachDockSub">
              {title} •{" "}
              {enemyCount ? `${enemyCount} enemies` : "no enemy team yet"}
              {context.enemyTop ? ` • top: ${context.enemyTop}` : ""}
            </div>
          </div>
        </div>
        <button
          className="coachDockToggle iconButton"
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand coach" : "Collapse coach"}
          aria-expanded={!collapsed}
        >
          <Icon name="chevron" />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="coachDockBody" ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="coachWelcome">
                <span className="eyebrow">A SECOND PERSPECTIVE</span>
                <h3>
                  Make the next move
                  <br />a better one.
                </h3>
                <p>
                  Talk through this draft, or attach a scoreboard for a closer
                  look.
                </p>
                <div className="coachPrompts">
                  {[
                    [
                      "Win condition",
                      "What is my win condition against this draft?",
                    ],
                    [
                      "Teamfight plan",
                      "How should I teamfight against this comp?",
                    ],
                    [
                      "Build adjustments",
                      "What build adjustments matter most against this draft?",
                    ],
                  ].map(([label, prompt]) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                    >
                      {label}
                      <Icon name="arrow" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, i) => (
              <div key={i} className={`coachMsg ${message.role}`}>
                <span className="messageRole">
                  {message.role === "user" ? "YOU" : "COACH"}
                </span>
                <div className="coachBubble">{message.content}</div>
              </div>
            ))}
            {loading && (
              <div className="coachThinking" role="status">
                <span />
                <span />
                <span />
                Reading the draft…
              </div>
            )}
          </div>
          {attachments.length > 0 && (
            <div className="attachments">
              {attachments.map((attachment) => (
                <div className="attachment" key={attachment.id}>
                  <img src={attachment.dataUrl} alt={attachment.name} />
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {uploadError && (
            <p role="alert" className="notice">
              {uploadError}
            </p>
          )}
          <form
            className="coachInputRow"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void onPickFiles(e.target.files)}
            />
            <button
              className="coachAttach iconButton"
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              aria-label="Attach scoreboard screenshot"
              title="Attach scoreboard screenshot"
            >
              <Icon name="upload" />
            </button>
            <input
              ref={inputRef}
              className="coachInput"
              aria-label="Ask coach"
              value={input}
              maxLength={4000}
              placeholder="Ask about your next move…"
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="coachSend iconButton"
              type="submit"
              disabled={loading || (!input.trim() && !attachments.length)}
              aria-label="Send"
              title="Send"
            >
              <Icon name="arrow" />
            </button>
          </form>
          <div className="coachDisclaimer">
            AI advice · Use your judgment in game.
          </div>
        </>
      )}
    </div>
  );
}

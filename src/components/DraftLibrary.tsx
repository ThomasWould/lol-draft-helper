import { useState } from "react";
import type { DraftSession } from "../draftSession";
import { CHAMPIONS, META } from "../recommendations/meta";
import { LIBRARY_LIMIT, useDraftLibrary } from "../hooks/useDraftLibrary";
import { Icon } from "./Icon";

export function DraftLibrary({
  draft,
  canSave,
  onLoad,
}: {
  draft: DraftSession;
  canSave: boolean;
  onLoad: (draft: DraftSession) => void;
}) {
  const { entries, save, remove, status, setStatus } = useDraftLibrary();
  const [name, setName] = useState("");
  return (
    <details className="draftLibrary">
      <summary>
        <Icon name="book" />
        <span>Draft library</span>
        <small>
          {entries.length} / {LIBRARY_LIMIT} saved
        </small>
        <Icon name="chevron" />
      </summary>
      <div className="libraryBody">
        <p>Keep matchup plans on this device and revisit them between games.</p>
        <form
          className="librarySave"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              canSave &&
              save(name || `${CHAMPIONS[draft.selected].label} draft`, draft)
            )
              setName("");
          }}
        >
          <label className="srOnly" htmlFor="draft-name">
            Draft name
          </label>
          <input
            id="draft-name"
            value={name}
            maxLength={60}
            placeholder="Name this draft…"
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="modeButton"
            type="submit"
            disabled={!canSave || entries.length >= LIBRARY_LIMIT}
          >
            Save draft
          </button>
        </form>
        {!canSave && <p>Add an opponent or teammate to save a plan.</p>}
        {status && (
          <p className="libraryStatus" role="status">
            {status}
          </p>
        )}
        {entries.length === LIBRARY_LIMIT && (
          <p>Library full. Remove a draft to make room for another.</p>
        )}
        {entries.length > 0 && (
          <ul className="libraryList">
            {entries.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.name}</strong>
                  <span>
                    {CHAMPIONS[entry.draft.selected].label} ·{" "}
                    {CHAMPIONS[entry.draft.selected].role} · Patch {entry.patch}
                  </span>
                  {entry.patch !== META.patch && (
                    <small>Advice will use the current reviewed patch.</small>
                  )}
                </div>
                <button
                  className="copyButton"
                  type="button"
                  aria-label={`Load ${entry.name}`}
                  onClick={() => {
                    onLoad({ ...entry.draft });
                    setStatus(`Loaded “${entry.name}”.`);
                  }}
                >
                  Load
                </button>
                <button
                  className="iconButton"
                  type="button"
                  aria-label={`Remove saved draft ${entry.name}`}
                  onClick={() => remove(entry.id)}
                >
                  <Icon name="close" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

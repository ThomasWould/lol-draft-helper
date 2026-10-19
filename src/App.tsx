import { useMemo, useState } from "react";
import "./App.css";
import { useChampionData } from "./hooks/useChampionData";
import { ChampionTextarea } from "./components/ChampionTextarea";
import type { DDragonChampion } from "./api/ddragon";

// recommendations + tags
import { getDraftTagsFromTraits, tagsToPills } from "./recommendations/tags";
import { getMasterYiRec } from "./recommendations/masterYi";
import type { ChampRec } from "./recommendations/types";
import {
  CHAMPIONS,
  META,
  matchesReviewedPatch,
  type ChampionKey,
} from "./recommendations/meta";
import {
  normalizeLoose,
  splitTokens,
  resolveChampions,
  removeEnemy,
} from "./draft";
import { getVolibearRec } from "./recommendations/volibear";

import { getBelvethRec } from "./recommendations/belveth";
import { getHeimerdingerRec } from "./recommendations/heimerdinger";
import { getMissFortuneRec } from "./recommendations/missFortune";
import { getLuxSupportRec } from "./recommendations/lux";

import { GameIcon } from "./components/GameIcon";
import { Icon } from "./components/Icon";
import itemIcons from "./data/item-icons.json";
import { EnemyScout } from "./components/EnemyScout";
import { CoachChat } from "./components/CoachChat";
import type { CoachContext } from "./coach/types";
import {
  draftLink,
  useDraftSession,
  type DraftSession,
} from "./hooks/useDraftSession";
import { LockInChecklist } from "./components/LockInChecklist";
import { RunePage } from "./components/RunePage";
import { LaneQuickPicks } from "./components/LaneQuickPicks";

const ITEM_ICONS = new Map(
  Object.entries(itemIcons).map(([name, image]) => [
    normalizeLoose(name),
    image,
  ]),
);

function isTopPick(k: ChampionKey) {
  return CHAMPIONS[k].role === "Top";
}
function isBotPick(k: ChampionKey) {
  return ["ADC", "Support"].includes(CHAMPIONS[k].role);
}
function championIconUrl(version: string, champ: DDragonChampion) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`;
}

export default function App() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const { draft, setDraft, saved, notice: sessionNotice } = useDraftSession();
  const { selected, enemyRaw, enemyTopRaw, enemyBotRaw } = draft;
  const [undoDraft, setUndoDraft] = useState<DraftSession | null>(null);
  const [lockIn, setLockIn] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareFallback, setShareFallback] = useState("");
  function updateDraft<K extends keyof DraftSession>(
    key: K,
    value: DraftSession[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setUndoDraft(null);
    setShareStatus("");
    setShareFallback("");
  }
  const setSelected = (value: ChampionKey) => updateDraft("selected", value);
  const setEnemyRaw = (value: string) => updateDraft("enemyRaw", value);
  const setEnemyTopRaw = (value: string) => updateDraft("enemyTopRaw", value);
  const setEnemyBotRaw = (value: string) => updateDraft("enemyBotRaw", value);

  function clearAllEnemyInputs() {
    setUndoDraft(draft);
    setDraft({ ...draft, enemyRaw: "", enemyTopRaw: "", enemyBotRaw: "" });
    setShareStatus("");
    setShareFallback("");
  }

  const { loading, error, version, championList } = useChampionData();

  const tokens = useMemo(() => splitTokens(enemyRaw), [enemyRaw]);
  const { matched, unmatched } = useMemo(
    () => resolveChampions(tokens, championList),
    [tokens, championList],
  );

  // resolve enemy top textbox into a champion (for Top picks)
  const topTokens = useMemo(() => splitTokens(enemyTopRaw), [enemyTopRaw]);
  const { matched: topMatched, unmatched: topUnmatched } = useMemo(
    () => resolveChampions(topTokens, championList),
    [topTokens, championList],
  );

  const botTokens = useMemo(() => splitTokens(enemyBotRaw), [enemyBotRaw]);
  const { matched: botMatched, unmatched: botUnmatched } = useMemo(
    () => resolveChampions(botTokens, championList),
    [botTokens, championList],
  );
  const activeTop = isTopPick(selected) ? topMatched[0] : undefined;
  const enemyTopNormalized = activeTop ? normalizeLoose(activeTop.name) : "";
  const enemyBotNormalized = useMemo(
    () =>
      isBotPick(selected)
        ? botMatched.slice(0, 2).map((c) => normalizeLoose(c.name))
        : [],
    [selected, botMatched],
  );
  const allEnemies = useMemo(() => {
    const lane = isTopPick(selected)
      ? topMatched.slice(0, 1)
      : isBotPick(selected)
        ? botMatched.slice(0, 2)
        : [];
    return [...lane, ...matched].filter(
      (c, i, all) => all.findIndex((x) => x.id === c.id) === i,
    );
  }, [selected, topMatched, botMatched, matched]);
  const scoutChamps = useMemo(() => allEnemies.slice(0, 5), [allEnemies]);
  const enemyNamesNormalized = useMemo(
    () => scoutChamps.map((c) => normalizeLoose(c.name)),
    [scoutChamps],
  );
  const shouldShowRecs = scoutChamps.length > 0;
  const tags = useMemo(
    () =>
      getDraftTagsFromTraits(
        enemyNamesNormalized,
        championList,
        enemyTopNormalized || undefined,
      ),
    [enemyNamesNormalized, championList, enemyTopNormalized],
  );

  const tagPills = useMemo(() => tagsToPills(tags), [tags]);

  const rec: ChampRec = useMemo(() => {
    if (selected === "masteryi")
      return getMasterYiRec(tags, enemyNamesNormalized);
    if (selected === "belveth")
      return getBelvethRec(tags, enemyNamesNormalized);
    if (selected === "volibear")
      return getVolibearRec(
        tags,
        enemyNamesNormalized,
        enemyTopNormalized || undefined,
      );
    if (selected === "heimerdinger")
      return getHeimerdingerRec(
        tags,
        enemyNamesNormalized,
        enemyTopNormalized || undefined,
      );

    if (selected === "missfortune")
      return getMissFortuneRec(tags, enemyNamesNormalized, enemyBotNormalized);

    return getLuxSupportRec(tags, enemyNamesNormalized, enemyBotNormalized);
  }, [
    selected,
    tags,
    enemyNamesNormalized,
    enemyTopNormalized,
    enemyBotNormalized,
  ]);

  const coachContext: CoachContext = useMemo(() => {
    const champMeta = CHAMPIONS[selected];

    return {
      championKey: selected,
      championLabel: champMeta.label,
      role: champMeta.role,

      enemyTeam: scoutChamps.map((c) => c.name),
      patch: META.patch,
      reviewedAt: META.reviewedAt,

      enemyTop: activeTop?.name,
      enemyBot: isBotPick(selected)
        ? botMatched
            .slice(0, 2)
            .map((c) => c.name)
            .join(", ") || undefined
        : undefined,

      detected: {
        tanks: tags.counts.tanks ?? 0,
        ccBurst: tags.counts.ccBurst ?? 0,
        ap: tags.counts.ap ?? 0,
        ad: tags.counts.ad ?? 0,
        flex: tags.counts.flex ?? 0,
        healing: tags.counts.healing ?? 0,
        pills: tagPills,
      },

      recommendations: {
        headlineLines: rec.headlineLines ?? [],
        itemsOrdered: rec.itemsOrdered ?? [],
        fightRule: rec.fightRule,
        runes: rec.runes,
        skillOrder: rec.skillOrder,
        starter: rec.starter,
      },
    };
  }, [selected, scoutChamps, activeTop, botMatched, tags, tagPills, rec]);

  const champion = CHAMPIONS[selected];
  const selectedData = championList.find(
    (c) => normalizeLoose(c.name) === selected,
  );
  const iconVersion = META.dataVersion;

  async function copyBuild() {
    try {
      await navigator.clipboard.writeText(
        [
          `${champion.label} · ${champion.role} · Patch ${META.patch}`,
          ...rec.headlineLines,
          ...rec.runes,
          `Skills: ${rec.skillOrder}`,
          `Start & spells: ${rec.starter.join(" · ")}`,
          ...rec.itemsOrdered.map(
            (item, index) =>
              `${index + 1}. ${item.name}${item.note ? ` — ${item.note}` : ""}`,
          ),
          rec.fightRule,
        ].join("\n"),
      );
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 2400);
  }

  async function shareDraft() {
    const link = draftLink(draft);
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus("Draft link copied");
      setShareFallback("");
    } catch {
      setShareStatus("Select and copy your draft link below.");
      setShareFallback(link);
    }
  }

  return (
    <div className={`page ${lockIn && shouldShowRecs ? "lockInMode" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#main">
          <span className="brandMark">
            <Icon name="spark" />
          </span>{" "}
          DRAFTROOM <span className="brandDivider" />{" "}
          <span className="brandSub">LEAGUE OF LEGENDS</span>
        </a>
        <div className="topbarLinks">
          <a
            className="patchBadge"
            href={META.patchUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className="statusDot" /> PATCH {META.patch}
          </a>
          <a
            className="githubLink"
            href="https://github.com/ThomasWould/lol-draft-helper"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <Icon name="external" />
          </a>
        </div>
      </header>

      <main id="main">
        <section className="intro">
          <div>
            <div className="eyebrow">A LITTLE PREPARATION. A BETTER GAME.</div>
            <h1>
              LoL Draft Helper<span className="titleDot">.</span>
            </h1>
            <p>Read the draft. Find your edge. Enter the Rift with a plan.</p>
          </div>
          <div className="introMeta">
            <Icon name="shield" />
            <span>
              Six champions. One clear plan.
              <small>Reviewed {META.reviewedAt} · Emerald+</small>
            </span>
          </div>
        </section>

        <div className="sessionBar" aria-label="Draft tools">
          <div className="sessionInfo">
            <Icon name="book" />
            <span>
              {saved
                ? "Draft saved on this device"
                : "Draft stays open in this tab"}
              <small>
                {sessionNotice || "Your plan evolves with every pick."}
              </small>
            </span>
          </div>
          <div className="sessionActions">
            <button
              className="copyButton"
              type="button"
              onClick={shareDraft}
              disabled={!shouldShowRecs}
            >
              <Icon name="external" /> Share draft
            </button>
            <button
              className="modeButton"
              type="button"
              disabled={!shouldShowRecs}
              aria-pressed={lockIn}
              onClick={() => setLockIn((v) => !v)}
            >
              <Icon name={lockIn ? "check" : "target"} />
              {lockIn ? "Back to draft" : "Lock-in view"}
            </button>
          </div>
        </div>
        {shareStatus && (
          <p className="shareStatus" role="status">
            {shareStatus}
          </p>
        )}
        {shareFallback && (
          <input
            className="shareFallback"
            aria-label="Draft share link"
            readOnly
            value={shareFallback}
            onFocus={(e) => e.target.select()}
          />
        )}

        <div className="workspace">
          <section className="card inputsCard" aria-label="Draft setup">
            <div className="sectionHeading">
              <div className="eyebrow">
                <span className="stepNumber">01</span> YOUR DRAFT
              </div>
              <span className="liveLabel">
                <span className="statusDot" /> Auto-updating
              </span>
            </div>
            <div className="pickIdentity">
              <GameIcon
                className="pickPortrait"
                label={champion.label}
                src={selectedData && championIconUrl(iconVersion, selectedData)}
              />
              <div>
                <span className="roleLabel">{champion.role}</span>
                <h2>{champion.label}</h2>
                <span className="muted small">
                  Your champion, your win condition.
                </span>
              </div>
            </div>
            <label className="label" htmlFor="champion-select">
              Pick your champion
            </label>
            <select
              id="champion-select"
              className="champSelect"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value as ChampionKey);
                setCopyState("idle");
              }}
            >
              {(["Jungle", "Top", "ADC", "Support"] as const).map((role) => (
                <optgroup key={role} label={role}>
                  {Object.entries(CHAMPIONS)
                    .filter(([, c]) => c.role === role)
                    .map(([key, c]) => (
                      <option key={key} value={key}>
                        {c.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            <div className="inputDivider" />
            <div className="enemyHeader">
              <label className="label" htmlFor="enemy-team">
                Enemy team
              </label>
              <button
                className="clearBtn"
                type="button"
                onClick={clearAllEnemyInputs}
                disabled={
                  !enemyRaw.trim() && !enemyTopRaw.trim() && !enemyBotRaw.trim()
                }
              >
                Clear all
              </button>
            </div>
            {undoDraft && (
              <div className="undoNotice" role="status">
                Draft cleared.
                <button
                  type="button"
                  onClick={() => {
                    setDraft(undoDraft);
                    setUndoDraft(null);
                  }}
                >
                  Undo clear
                </button>
              </div>
            )}
            <p className="fieldHelp">
              Add names separated by commas or new lines.
            </p>
            <ChampionTextarea
              id="enemy-team"
              value={enemyRaw}
              onChange={setEnemyRaw}
              championList={championList}
              disabled={championList.length === 0}
              ariaLabel="Enemy team"
              rows={3}
            />
            {loading && (
              <div className="dataStatus" role="status">
                Loading champion data…
              </div>
            )}
            {error && (
              <div className="notice">Champion data notice: {error}</div>
            )}
            {unmatched.length > 0 && (
              <p className="notice">Not recognized: {unmatched.join(", ")}</p>
            )}
            <div className="rosterHeader">
              <span className="label">OPPONENTS</span>
              <span>
                {scoutChamps.length}
                <span className="muted"> / 5</span>
              </span>
            </div>
            <div
              className="enemySlots"
              aria-label={`${scoutChamps.length} of 5 enemies entered`}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  className={`enemySlot ${scoutChamps[i] ? "filled" : ""}`}
                  key={i}
                >
                  {scoutChamps[i] ? (
                    <GameIcon
                      label={scoutChamps[i].name}
                      src={championIconUrl(iconVersion, scoutChamps[i])}
                    />
                  ) : (
                    <Icon name="shield" />
                  )}
                  <span>{scoutChamps[i]?.name ?? "Unknown"}</span>
                </div>
              ))}
            </div>
            {matched.length > 0 && (
              <div className="chipRow">
                {matched.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chip"
                    aria-label={`Remove ${c.name}`}
                    title={`Remove ${c.name}`}
                    onClick={() => setEnemyRaw(removeEnemy(c, enemyRaw))}
                  >
                    {c.name}
                    <Icon name="close" />
                  </button>
                ))}
              </div>
            )}
            {(allEnemies.length > 5 ||
              (isTopPick(selected) && topMatched.length > 1) ||
              (isBotPick(selected) && botMatched.length > 2)) && (
              <p role="status" className="notice">
                A draft has five enemies. Using the first lane matchup (one top
                or two bot) and up to five unique enemies total.
              </p>
            )}
            {isTopPick(selected) && (
              <div className="laneInput">
                <label className="label" htmlFor="enemy-top">
                  Enemy top (optional)
                </label>
                <p className="fieldHelp">Fine-tune your lane and wave plan.</p>
                <ChampionTextarea
                  id="enemy-top"
                  value={enemyTopRaw}
                  onChange={setEnemyTopRaw}
                  championList={championList}
                  disabled={!championList.length}
                  ariaLabel="Enemy top"
                  placeholder="e.g. Teemo"
                  rows={1}
                />
                <LaneQuickPicks
                  candidates={matched}
                  selected={topMatched.slice(0, 1)}
                  limit={1}
                  onChange={setEnemyTopRaw}
                />
              </div>
            )}
            {isBotPick(selected) && (
              <div className="laneInput">
                <label className="label" htmlFor="enemy-bot">
                  Enemy bot lane (optional)
                </label>
                <p className="fieldHelp">Add the enemy ADC and support.</p>
                <ChampionTextarea
                  id="enemy-bot"
                  value={enemyBotRaw}
                  onChange={setEnemyBotRaw}
                  championList={championList}
                  disabled={!championList.length}
                  ariaLabel="Enemy bot lane"
                  placeholder="e.g. Jinx, Leona"
                  rows={1}
                />
                <LaneQuickPicks
                  candidates={matched}
                  selected={botMatched.slice(0, 2)}
                  limit={2}
                  onChange={setEnemyBotRaw}
                />
              </div>
            )}
            {((isTopPick(selected) && topUnmatched.length > 0) ||
              (isBotPick(selected) && botUnmatched.length > 0)) && (
              <p role="status" className="notice">
                Lane not recognized:{" "}
                {(isTopPick(selected) ? topUnmatched : botUnmatched).join(", ")}
              </p>
            )}
            {scoutChamps.length > 0 ? (
              <div className="detected">
                <div className="label">Detected:</div>
                <div className="detRow">
                  {tags.counts.tanks > 0 && (
                    <span className="detTag detTank">
                      {tags.counts.tanks} tank
                      {tags.counts.tanks === 1 ? "" : "s"}
                    </span>
                  )}
                  {tags.counts.ccBurst > 0 && (
                    <span className="detTag detCC">
                      {tags.counts.ccBurst} hard CC
                    </span>
                  )}
                  {tags.counts.ap > 0 && (
                    <span className="detTag detAP">{tags.counts.ap} AP</span>
                  )}
                  {tags.counts.ad > 0 && (
                    <span className="detTag detAD">{tags.counts.ad} AD</span>
                  )}
                  {tags.counts.flex > 0 && (
                    <span className="detTag detFlex">
                      {tags.counts.flex} flex (AD/AP)
                    </span>
                  )}
                  {tags.counts.healing > 0 && (
                    <span className="detTag detHeal">
                      {tags.counts.healing} healing
                    </span>
                  )}
                  {tags.rangedTop && (
                    <span className="detTag detRanged">ranged top</span>
                  )}
                </div>
                <EnemyScout selected={selected} enemies={scoutChamps} />
              </div>
            ) : (
              <button
                className="exampleBtn"
                type="button"
                onClick={() => setEnemyRaw("Malphite, Vi, Lux, Jinx, Leona")}
              >
                Just exploring? Try an example <Icon name="arrow" />
              </button>
            )}
          </section>

          <section className="card planCard" aria-label="Your game plan">
            <div className="championHero">
              {selectedData && (
                <img
                  key={selectedData.id}
                  className="heroArt"
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedData.id}_0.jpg`}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="heroOrnament" aria-hidden="true">
                <Icon name="compass" />
              </div>
              <div className="heroContent">
                <div className="eyebrow">
                  <span className="stepNumber">02</span> YOUR GAME PLAN
                </div>
                <div className="heroTitle">
                  <h2>{champion.label}</h2>
                  <span className="roleBadge">{champion.role}</span>
                </div>
                <p>Know your windows. Play to your strengths.</p>
              </div>
              <span className="heroCorner" aria-hidden="true" />
            </div>
            <div className="planBody">
              <div className="planTopline">
                <h2 className="planHeading">Recommendations</h2>
                <span
                  className={`draftStatus ${shouldShowRecs ? "ready" : ""}`}
                >
                  <span className="statusDot" />
                  {shouldShowRecs ? "Draft adapted" : "Awaiting draft"}
                </span>
              </div>
              <div className="planSource">
                <span>PATCH {META.patch}</span>
                <span className="sourceDivider">/</span>
                <a
                  href={CHAMPIONS[selected].source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Build source <Icon name="external" />
                </a>
              </div>
              {version && !matchesReviewedPatch(version) && (
                <p role="status" className="notice">
                  Champion data {version} differs from reviewed patch{" "}
                  {META.patch}. Builds need a new review.
                </p>
              )}
              {!shouldShowRecs ? (
                <div className="emptyState">
                  <span className="emptyEmblem">
                    <Icon name="compass" />
                  </span>
                  <span className="eyebrow">THE ADVANTAGE STARTS HERE</span>
                  <h3>A draft worth preparing for.</h3>
                  <p>
                    Add your opponents to reveal a tailored build,
                    <br className="desktopBreak" /> rune setup, and a plan for
                    the fights ahead.
                  </p>
                  <button
                    className="goldButton"
                    type="button"
                    onClick={() => {
                      setEnemyRaw("Malphite, Vi, Lux, Jinx, Leona");
                    }}
                  >
                    Explore an example <Icon name="arrow" />
                  </button>
                  <div className="emptySteps">
                    <span>01 · Add opponents</span>
                    <span>02 · Read the draft</span>
                    <span>03 · Find your edge</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="draftProgress">
                    <div>
                      <span className="eyebrow">
                        {scoutChamps.length === 5
                          ? "FULL DRAFT IN VIEW"
                          : "SCOUTING IN PROGRESS"}
                      </span>
                      <span>{scoutChamps.length} / 5 revealed</span>
                    </div>
                    <div className="draftProgressTrack" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={i < scoutChamps.length ? "revealed" : ""}
                        />
                      ))}
                    </div>
                    <p>
                      {scoutChamps.length === 5
                        ? "All opponents accounted for. Review your setup before locking in."
                        : "Early plan based on known opponents. Add the remaining picks to refine it."}
                    </p>
                  </div>
                  {lockIn && (
                    <div
                      className="lockInOpponents"
                      aria-label="Opponents in this plan"
                    >
                      {scoutChamps.map((c) => (
                        <span key={c.id}>
                          <GameIcon
                            label={c.name}
                            src={championIconUrl(iconVersion, c)}
                          />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {lockIn && (
                    <LockInChecklist
                      key={`${selected}:${scoutChamps.map((c) => c.id).join(",")}:${enemyTopNormalized}:${enemyBotNormalized.join(",")}`}
                      rec={rec}
                    />
                  )}
                  {tagPills.length > 0 && (
                    <div className="pillRow threatPills">
                      {tagPills.map((pill) => (
                        <span className="pill" key={pill}>
                          {pill}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="recLines">
                    {rec.headlineLines.map((line) => {
                      const i = line.indexOf(":");
                      const label = i < 0 ? "NOTE" : line.slice(0, i);
                      return (
                        <div className="recLine" key={line}>
                          <div className="recKey">{label}</div>
                          <div className="recVal">
                            {i < 0 ? line : line.slice(i + 1).trim()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="buildHeader">
                    <div>
                      <span className="eyebrow">THE RIGHT TOOLS</span>
                      <h3>Build path</h3>
                      <span className="label small">ITEMS (IN ORDER):</span>
                    </div>
                    <button
                      className="copyButton"
                      type="button"
                      onClick={copyBuild}
                      aria-label={
                        copyState === "copied"
                          ? "Copied!"
                          : copyState === "error"
                            ? "Copy unavailable"
                            : "Copy build"
                      }
                    >
                      <Icon name={copyState === "copied" ? "check" : "copy"} />
                      <span role="status">
                        {copyState === "copied"
                          ? "Copied!"
                          : copyState === "error"
                            ? "Copy unavailable"
                            : "Copy build"}
                      </span>
                    </button>
                  </div>
                  <ol className="itemList">
                    {rec.itemsOrdered.map((item, i) => (
                      <li className="itemRow" key={`${item.name}-${i}`}>
                        <div className="itemVisual">
                          <GameIcon
                            className="itemIcon"
                            label={item.name}
                            src={
                              ITEM_ICONS.get(normalizeLoose(item.name)) &&
                              `https://ddragon.leagueoflegends.com/cdn/${iconVersion}/img/item/${ITEM_ICONS.get(normalizeLoose(item.name))}`
                            }
                          />
                          <span className="itemNum">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="itemContent">
                          <span className="itemName">{item.name}</span>
                          {item.note && (
                            <span className="itemNote">{item.note}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                  {rec.fightRule && (
                    <div className="fightRuleBox">
                      <span className="fightIcon">
                        <Icon name="target" />
                      </span>
                      <div>
                        <div className="eyebrow">FIGHT RULE:</div>
                        <p className="fightRuleText">
                          {rec.fightRule.replace(/^FIGHT RULE:\s*/, "")}
                        </p>
                      </div>
                    </div>
                  )}
                  {rec.waveTips && (
                    <details className="waveBox">
                      <summary>
                        <Icon name="compass" />
                        <div>
                          <span className="waveKey">WAVE</span>
                          <span className="waveTitle">
                            {rec.waveTips.title}
                          </span>
                        </div>
                        <Icon name="chevron" />
                      </summary>
                      <ul className="waveList">
                        {rec.waveTips.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <details className="recDetails">
                    <summary>
                      <Icon name="book" />
                      <span>Full runes, skills & situational advice</span>
                      <Icon name="chevron" />
                    </summary>
                    <div className="detailsContent">
                      <div className="label">Rune page</div>
                      <RunePage lines={rec.runes} />
                      <p>
                        <b>Skills:</b> {rec.skillOrder}
                      </p>
                      <p>
                        <b>Start & spells:</b> {rec.starter.join(" · ")}
                      </p>
                      <div className="label">Adapt as the game develops</div>
                      <ul>
                        {[...rec.situational, ...rec.notes].map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </>
              )}
              {!!rec.bans?.length && (
                <div className="banSection">
                  <div>
                    <Icon name="shield" />
                    <span className="label">RECOMMENDED BANS:</span>
                    <span className="muted small">Matchup options</span>
                  </div>
                  <div className="banRow">
                    {rec.bans.map((ban) => {
                      const data = championList.find(
                        (c) => normalizeLoose(c.name) === normalizeLoose(ban),
                      );
                      return (
                        <span className="banChip" key={ban}>
                          <GameIcon
                            label={ban}
                            src={data && championIconUrl(iconVersion, data)}
                          />
                          {ban}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="planFootnote">
                Adapt this plan to actual items, lane pressure, and the threats
                reaching you.
              </p>
            </div>
          </section>

          <aside className="card coachCard" aria-label="Draft coach">
            <CoachChat key={selected} context={coachContext} />
          </aside>
        </div>
      </main>
      <footer className="footer">
        <span className="footerBrand">
          <Icon name="spark" /> BUILT FOR THE MOMENT BEFORE THE RIFT.
        </span>
        <span>
          {META.scope} ·{" "}
          <a href={META.patchUrl} target="_blank" rel="noreferrer">
            Patch notes <Icon name="external" />
          </a>
        </span>
        <p>Champion and item artwork © Riot Games.</p>
      </footer>
    </div>
  );
}

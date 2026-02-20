"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiceFive,
  faEye,
  faHandFist,
  faFlaskVial,
  faLink,
  faPaperPlane,
  faSkull,
  faMoon,
  faUserSecret,
} from "@fortawesome/free-solid-svg-icons";
import DiceRoller from "@/components/DiceRoller";
import AttackRoller from "@/components/AttackRoller";
import { useAppDispatch } from "@/store/hooks";
import { setSides, setCount, setPerDieBonus, setTotalBonus, setResults } from "@/store/diceSlice";
import type { OpponentAction } from "@/lib/types/actions";
import { formatActionLabel } from "@/lib/types/actions";

type Character = {
  _id: string;
  name: string;
  armorClass: number;
};

type Opponent = {
  _id: string;
  name: string;
  type: string;
  alignment: string;
  actions: (OpponentAction | string)[];
  hitPoints: number;
  armorClass: number;
  initiativeBonus?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  savingThrowDex?: number;
  savingThrowCon?: number;
  savingThrowWis?: number;
};

type Encounter = {
  _id: string;
  name: string;
  opponents: Opponent[];
};

const PHASES = ["Initiative", "Combat", "Resolution"] as const;
type Phase = (typeof PHASES)[number];

export default function FightPage() {
  const dispatch = useAppDispatch();
  const [phase, setPhase] = useState<Phase>("Initiative");
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [initiatives, setInitiatives] = useState<Record<string, string>>({});
  const [opponentHitPoints, setOpponentHitPoints] = useState<Record<string, string>>({});
  const [combatants, setCombatants] = useState<{ id: string; name: string; initiative: number }[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [incapacitatedIds, setIncapacitatedIds] = useState<Set<string>>(new Set());
  const [links, setLinks] = useState<Record<string, string>>({});
  const [statusInfo, setStatusInfo] = useState<Record<string, string>>({});
  const [statusPopupId, setStatusPopupId] = useState<string | null>(null);
  type SpecialStatusKey = "snooze" | "poison" | "paperPlane" | "invisible";
  const [specialStatuses, setSpecialStatuses] = useState<Record<string, Partial<Record<SpecialStatusKey, boolean>>>>({});
  const [loadingEncounters, setLoadingEncounters] = useState(true);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [attackModalOpen, setAttackModalOpen] = useState(false);
  const [opponentDetailId, setOpponentDetailId] = useState<string | null>(null);
  const [fullOpponent, setFullOpponent] = useState<Opponent | null>(null);
  const [fullOpponentLoading, setFullOpponentLoading] = useState(false);
  const [fullOpponentError, setFullOpponentError] = useState<string | null>(null);

  const selectedEncounter = selectedEncounterId
    ? encounters.find((e) => e._id === selectedEncounterId) ?? null
    : null;
  const opponents = selectedEncounter?.opponents ?? [];

  useEffect(() => {
    if (!opponentDetailId || phase !== "Combat") {
      setFullOpponent(null);
      setFullOpponentError(null);
      return;
    }
    const match = opponentDetailId.match(/^opp-[^-]+-(\d+)$/);
    const opp = match ? opponents[parseInt(match[1], 10)] : null;
    const oppId = opp && "_id" in opp ? (opp as Opponent)._id : null;
    if (!oppId) {
      setFullOpponent(null);
      setFullOpponentError("Opponent not found");
      return;
    }
    setFullOpponentLoading(true);
    setFullOpponentError(null);
    fetch(`/api/opponents/${oppId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load opponent");
        return res.json();
      })
      .then((data) => {
        setFullOpponent(data as Opponent);
      })
      .catch(() => setFullOpponentError("Failed to load opponent"))
      .finally(() => setFullOpponentLoading(false));
  }, [opponentDetailId, phase, opponents]);

  useEffect(() => {
    if (!opponentDetailId) {
      setFullOpponent(null);
      setFullOpponentLoading(false);
      setFullOpponentError(null);
    }
  }, [opponentDetailId]);

  useEffect(() => {
    setCombatants([]);
    setCurrentTurnIndex(0);
    setIncapacitatedIds(new Set());
    setLinks({});
    setStatusInfo({});
    setStatusPopupId(null);
    setSpecialStatuses({});
  }, [selectedEncounterId]);

  const fetchEncounters = useCallback(() => {
    setLoadingEncounters(true);
    fetch("/api/encounters")
      .then((res) => res.json())
      .then((data) => setEncounters(Array.isArray(data) ? data : []))
      .catch(() => setEncounters([]))
      .finally(() => setLoadingEncounters(false));
  }, []);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  useEffect(() => {
    setLoadingCharacters(true);
    fetch("/api/characters")
      .then((res) => res.json())
      .then((data) => setCharacters(Array.isArray(data) ? data : []))
      .catch(() => setCharacters([]))
      .finally(() => setLoadingCharacters(false));
  }, []);

  const setInitiative = (id: string, value: string) => {
    setInitiatives((prev) => ({ ...prev, [id]: value }));
  };

  const rollInitiative = (id: string, name: string, initiativeBonus: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + (initiativeBonus ?? 0);
    setCombatants((prev) => {
      const next = prev.some((c) => c.id === id)
        ? prev.map((c) => (c.id === id ? { ...c, name, initiative: total } : c))
        : [...prev, { id, name, initiative: total }];
      return next.sort((a, b) => b.initiative - a.initiative);
    });
  };

  const addCharacterToCombatants = (id: string, name: string) => {
    const raw = initiatives[id]?.trim();
    const initiative = raw === "" ? NaN : parseInt(raw, 10);
    if (Number.isNaN(initiative)) return;
    setCombatants((prev) => {
      const next = prev.some((c) => c.id === id)
        ? prev.map((c) => (c.id === id ? { ...c, name, initiative } : c))
        : [...prev, { id, name, initiative }];
      return next.sort((a, b) => b.initiative - a.initiative);
    });
  };

  const removeFromCombatants = (id: string) => {
    setIncapacitatedIds((prev) => new Set(prev).add(id));
    setLinks((prev) => {
      const other = prev[id];
      if (!other) return prev;
      const next = { ...prev };
      delete next[id];
      delete next[other];
      return next;
    });
    const removedIndex = combatants.findIndex((c) => c.id === id);
    const next = combatants.filter((c) => c.id !== id);
    setCombatants(next);
    if (removedIndex >= 0) {
      if (removedIndex < currentTurnIndex) {
        setCurrentTurnIndex((i) => Math.max(0, i - 1));
      } else if (removedIndex === currentTurnIndex || currentTurnIndex >= next.length) {
        setCurrentTurnIndex(Math.min(currentTurnIndex, Math.max(0, next.length - 1)));
      }
    }
  };

  const characterParticipants = characters.map((c) => ({
    id: `char-${c._id}`,
    name: c.name,
    armorClass: c.armorClass,
  }));

  const opponentParticipants = opponents.map((o, i) => ({
    id: `opp-${selectedEncounterId}-${i}`,
    name: o.name,
    initiativeBonus: o.initiativeBonus ?? 0,
    hitPoints: o.hitPoints,
    opponent: o,
  }));

  const setOpponentHP = (id: string, value: string) => {
    setOpponentHitPoints((prev) => ({ ...prev, [id]: value }));
  };

  const maxInitiative = combatants.length > 0 ? Math.max(...combatants.map((c) => c.initiative)) : null;
  const effectiveTurnIndex =
    phase === "Combat" && combatants.length > 0
      ? Math.min(currentTurnIndex, combatants.length - 1)
      : 0;
  const highlightedCombatantIds =
    phase === "Combat" && combatants.length > 0
      ? new Set([combatants[effectiveTurnIndex].id])
      : new Set(
          maxInitiative != null ? combatants.filter((c) => c.initiative === maxInitiative).map((c) => c.id) : []
        );
  const combatantIds = new Set(combatants.map((c) => c.id));
  const activeCombatantId =
    combatants.length > 0
      ? (phase === "Combat"
          ? combatants[effectiveTurnIndex]?.id
          : combatants.find((c) => highlightedCombatantIds.has(c.id))?.id) ?? null
      : null;

  const toggleLink = (targetId: string) => {
    if (!activeCombatantId || activeCombatantId === targetId) return;
    setLinks((prev) => {
      const next = { ...prev };
      const currentLinked = next[activeCombatantId!];
      const targetLinked = next[targetId];
      if (currentLinked === targetId) {
        delete next[activeCombatantId!];
        delete next[targetId];
      } else {
        if (currentLinked) {
          delete next[currentLinked];
          delete next[activeCombatantId!];
        }
        if (targetLinked) {
          delete next[targetLinked];
          delete next[targetId];
        }
        next[activeCombatantId!] = targetId;
        next[targetId] = activeCombatantId!;
      }
      return next;
    });
  };

  const activeLinkedId = activeCombatantId ? links[activeCombatantId] : null;
  const activeLinkedName =
    activeLinkedId &&
    (combatants.find((c) => c.id === activeLinkedId)?.name ??
      opponentParticipants.find((p) => p.id === activeLinkedId)?.name ??
      characterParticipants.find((p) => p.id === activeLinkedId)?.name);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Fight!
            </h1>
            <div className="flex gap-2">
              {PHASES.map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                phase === p
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {p}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDiceModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            aria-label="Open dice roller"
          >
            <FontAwesomeIcon icon={faDiceFive} className="text-base" />
            Dice Roller
          </button>
          <button
            type="button"
            onClick={() => setAttackModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            aria-label="Open attack roller"
          >
            <FontAwesomeIcon icon={faHandFist} className="text-base" />
            Attack Roller
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_1fr_minmax(280px,360px)]">
          {/* Left: Encounter selector, or opponents when encounter chosen */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {selectedEncounterId ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Opponents
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedEncounterId(null)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Change encounter
                  </button>
                </div>
                {opponents.length === 0 ? (
                  <p className="text-sm text-zinc-500">No opponents in this encounter.</p>
                ) : (
                  <ul className="space-y-2">
                    {opponentParticipants.map(({ id, name, initiativeBonus, hitPoints, opponent: fullOpponent }) => {
                      const isHighlighted = highlightedCombatantIds.has(id);
                      const notInCombat = phase === "Combat" && !combatantIds.has(id);
                      const isIncapacitated = phase === "Combat" && incapacitatedIds.has(id);
                      const isGreyed = notInCombat || isIncapacitated;
                      const isLinkedToActive = activeCombatantId !== null && links[activeCombatantId] === id;
                      const canLink = !!activeCombatantId && activeCombatantId !== id;
                      return (
                      <li
                        key={id}
                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                          isHighlighted
                            ? "bg-amber-100 ring-1 ring-amber-400 dark:bg-amber-900/30 dark:ring-amber-500"
                            : isGreyed
                              ? "bg-zinc-100 opacity-60 dark:bg-zinc-800/30 dark:opacity-60"
                              : "bg-zinc-50 dark:bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex min-w-0 shrink items-center gap-2">
                          {phase !== "Combat" ? (
                            <button
                              type="button"
                              onClick={() => canLink && toggleLink(id)}
                              disabled={!canLink}
                              title={canLink ? (isLinkedToActive ? "Unlink from active" : "Link to active") : "Select active combatant first"}
                              className={`shrink-0 rounded p-1 transition-colors ${canLink ? "hover:bg-zinc-200 dark:hover:bg-zinc-700" : "cursor-default opacity-50"}`}
                              aria-label={isLinkedToActive ? `${name} linked to active` : `Link ${name} to active combatant`}
                            >
                              <FontAwesomeIcon
                                icon={faLink}
                                className={`text-xs ${isLinkedToActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}
                              />
                            </button>
                          ) : null}
                          <span
                            role={phase === "Combat" ? "button" : undefined}
                            tabIndex={phase === "Combat" ? 0 : undefined}
                            onClick={phase === "Combat" ? () => setOpponentDetailId(id) : undefined}
                            onKeyDown={phase === "Combat" ? (e) => e.key === "Enter" && setOpponentDetailId(id) : undefined}
                            className={`min-w-0 truncate text-sm font-medium ${isGreyed ? "text-zinc-500 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"} ${phase === "Combat" ? "cursor-pointer hover:underline" : ""}`}
                          >
                            {name}
                            {phase === "Combat" && (
                              <>
                                {statusInfo[id]?.trim() ? (
                                  <FontAwesomeIcon icon={faEye} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Has status" />
                                ) : null}
                                {specialStatuses[id]?.snooze ? (
                                  <FontAwesomeIcon icon={faMoon} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Sleeping" />
                                ) : null}
                                {specialStatuses[id]?.poison ? (
                                  <FontAwesomeIcon icon={faFlaskVial} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Poison" />
                                ) : null}
                                {specialStatuses[id]?.paperPlane ? (
                                  <FontAwesomeIcon icon={faPaperPlane} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Flying" />
                                ) : null}
                                {specialStatuses[id]?.invisible ? (
                                  <FontAwesomeIcon icon={faUserSecret} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Invisible" />
                                ) : null}
                              </>
                            )}
                          </span>
                        </div>
                        {phase === "Initiative" ? (
                          <button
                            type="button"
                            onClick={() => rollInitiative(id, name, initiativeBonus)}
                            className="shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                          >
                            Roll
                          </button>
                        ) : phase === "Combat" ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <label className="flex items-center gap-1">
                              <span className="sr-only">Hit points for {name}</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                className="w-14 rounded border border-zinc-300 bg-white px-2 py-1 text-right text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                value={opponentHitPoints[id] ?? String(hitPoints)}
                                onChange={(e) => setOpponentHP(id, e.target.value)}
                                placeholder="—"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => canLink && toggleLink(id)}
                              disabled={!canLink}
                              title={canLink ? (isLinkedToActive ? "Unlink from active" : "Link to active") : "Select active combatant first"}
                              className={`shrink-0 rounded p-1 transition-colors ${canLink ? "hover:bg-zinc-200 dark:hover:bg-zinc-700" : "cursor-default opacity-50"}`}
                              aria-label={isLinkedToActive ? `${name} linked to active` : `Link ${name} to active combatant`}
                            >
                              <FontAwesomeIcon
                                icon={faLink}
                                className={`text-xs ${isLinkedToActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => !incapacitatedIds.has(id) && removeFromCombatants(id)}
                              className="rounded p-1 transition-colors hover:opacity-80"
                              title={isIncapacitated ? "Incapacitated" : "Mark incapacitated"}
                              aria-label={isIncapacitated ? `${name} is incapacitated` : `Mark ${name} incapacitated`}
                            >
                              <FontAwesomeIcon
                                icon={faSkull}
                                className={`text-sm ${isIncapacitated ? "text-red-700 opacity-60 dark:text-red-800 dark:opacity-60" : "text-zinc-500 dark:text-zinc-400 hover:text-red-900 dark:hover:text-red-950"}`}
                              />
                            </button>
                          </div>
                        ) : (
                          <label className="flex shrink-0 items-center gap-1">
                            <span className="sr-only">Initiative for {name}</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              className="w-14 rounded border border-zinc-300 bg-white px-2 py-1 text-right text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                              value={initiatives[id] ?? ""}
                              onChange={(e) => setInitiative(id, e.target.value)}
                              placeholder="—"
                            />
                          </label>
                        )}
                      </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Encounter
                </h2>
                {loadingEncounters ? (
                  <p className="text-sm text-zinc-500">Loading…</p>
                ) : encounters.length === 0 ? (
                  <p className="text-sm text-zinc-500">No encounters yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {encounters.map((enc) => (
                      <li key={enc._id}>
                        <button
                          onClick={() => setSelectedEncounterId(enc._id)}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                          {enc.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {/* Middle: Combatants in initiative order + link status */}
          <div className="flex flex-col gap-4">
          <section className="flex min-h-[320px] flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {phase === "Initiative" ? "Combatants" : phase}
              </h2>
              {phase === "Combat" && combatants.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentTurnIndex((i) => (i + 1) % combatants.length)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Next
                </button>
              )}
            </div>
            {combatants.length > 0 ? (
              <ul className="space-y-2">
                {combatants.map(({ id, name, initiative }, index) => {
                  const isHighlighted =
                    phase === "Combat" ? index === effectiveTurnIndex : maxInitiative != null && initiative === maxInitiative;
                  return (
                    <li
                      key={id}
                      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                        isHighlighted
                          ? "bg-amber-100 ring-1 ring-amber-400 dark:bg-amber-900/30 dark:ring-amber-500"
                          : "bg-zinc-50 dark:bg-zinc-800/50"
                      }`}
                    >
                      <span
                        role={phase === "Combat" ? "button" : undefined}
                        tabIndex={phase === "Combat" ? 0 : undefined}
                        onClick={phase === "Combat" ? () => setStatusPopupId(id) : undefined}
                        onKeyDown={phase === "Combat" ? (e) => e.key === "Enter" && setStatusPopupId(id) : undefined}
                        className={`min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200 ${phase === "Combat" ? "cursor-pointer hover:underline" : ""}`}
                      >
                        {name}
                        {phase === "Combat" && (
                          <>
                            {statusInfo[id]?.trim() ? (
                              <FontAwesomeIcon icon={faEye} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Has status" />
                            ) : null}
                            {specialStatuses[id]?.snooze ? (
                              <FontAwesomeIcon icon={faMoon} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Sleeping" />
                            ) : null}
                            {specialStatuses[id]?.poison ? (
                              <FontAwesomeIcon icon={faFlaskVial} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Poison" />
                            ) : null}
                            {specialStatuses[id]?.paperPlane ? (
                              <FontAwesomeIcon icon={faPaperPlane} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Flying" />
                            ) : null}
                            {specialStatuses[id]?.invisible ? (
                              <FontAwesomeIcon icon={faUserSecret} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Invisible" />
                            ) : null}
                          </>
                        )}
                      </span>
                      <span className="shrink-0 text-right text-sm tabular-nums font-medium text-zinc-600 dark:text-zinc-400">
                        {initiative}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/30">
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {phase === "Initiative"
                    ? "Roll initiative for opponents to add them here (highest first)"
                    : phase === "Combat"
                      ? "Add combatants in Initiative phase first"
                      : "(Reserved for later use)"}
                </span>
              </div>
            )}
          </section>

          {/* Link status: under initiative order */}
          {activeCombatantId && combatants.length > 0 ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Link status
              </h2>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Active: {combatants.find((c) => c.id === activeCombatantId)?.name ?? "—"}
                </span>
                {activeLinkedName ? (
                  <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                    · Linked to: {activeLinkedName}
                  </span>
                ) : (
                  <span className="ml-2 text-zinc-500 dark:text-zinc-500">· Not linked</span>
                )}
              </div>
            </section>
          ) : null}
          </div>

          {/* Right: Characters with initiative (always visible) */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Characters
            </h2>
            {loadingCharacters ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : characterParticipants.length === 0 ? (
              <p className="text-sm text-zinc-500">No characters yet.</p>
            ) : (
              <ul className="space-y-2">
                {characterParticipants.map(({ id, name, armorClass }) => {
                  const isHighlighted = highlightedCombatantIds.has(id);
                  const notInCombat = phase === "Combat" && !combatantIds.has(id);
                  const isIncapacitated = phase === "Combat" && incapacitatedIds.has(id);
                  const isGreyed = notInCombat || isIncapacitated;
                  const isLinkedToActive = activeCombatantId !== null && links[activeCombatantId] === id;
                  const canLink = !!activeCombatantId && activeCombatantId !== id;
                  return (
                  <li
                    key={id}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                      isHighlighted
                        ? "bg-amber-100 ring-1 ring-amber-400 dark:bg-amber-900/30 dark:ring-amber-500"
                        : isGreyed
                          ? "bg-zinc-100 opacity-60 dark:bg-zinc-800/30 dark:opacity-60"
                          : "bg-zinc-50 dark:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex min-w-0 shrink items-center gap-2">
                      {phase !== "Combat" ? (
                        <button
                          type="button"
                          onClick={() => canLink && toggleLink(id)}
                          disabled={!canLink}
                          title={canLink ? (isLinkedToActive ? "Unlink from active" : "Link to active") : "Select active combatant first"}
                          className={`shrink-0 rounded p-1 transition-colors ${canLink ? "hover:bg-zinc-200 dark:hover:bg-zinc-700" : "cursor-default opacity-50"}`}
                          aria-label={isLinkedToActive ? `${name} linked to active` : `Link ${name} to active combatant`}
                        >
                          <FontAwesomeIcon
                            icon={faLink}
                            className={`text-xs ${isLinkedToActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}
                          />
                        </button>
                      ) : null}
                      <span
                        role={phase === "Combat" ? "button" : undefined}
                        tabIndex={phase === "Combat" ? 0 : undefined}
                        onClick={phase === "Combat" ? () => setStatusPopupId(id) : undefined}
                        onKeyDown={phase === "Combat" ? (e) => e.key === "Enter" && setStatusPopupId(id) : undefined}
                        className={`min-w-0 truncate text-sm font-medium ${isGreyed ? "text-zinc-500 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"} ${phase === "Combat" ? "cursor-pointer hover:underline" : ""}`}
                      >
                        {name}
                        {phase === "Combat" && (
                          <>
                            {statusInfo[id]?.trim() ? (
                              <FontAwesomeIcon icon={faEye} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Has status" />
                            ) : null}
                            {specialStatuses[id]?.snooze ? (
                              <FontAwesomeIcon icon={faMoon} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Sleeping" />
                            ) : null}
                            {specialStatuses[id]?.poison ? (
                              <FontAwesomeIcon icon={faFlaskVial} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Poison" />
                            ) : null}
                            {specialStatuses[id]?.paperPlane ? (
                              <FontAwesomeIcon icon={faPaperPlane} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Flying" />
                            ) : null}
                            {specialStatuses[id]?.invisible ? (
                              <FontAwesomeIcon icon={faUserSecret} className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400" title="Invisible" />
                            ) : null}
                          </>
                        )}
                      </span>
                    </div>
                    {phase === "Combat" ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-right text-sm tabular-nums font-medium text-zinc-600 dark:text-zinc-400">
                          AC {armorClass}
                        </span>
                        <button
                          type="button"
                          onClick={() => canLink && toggleLink(id)}
                          disabled={!canLink}
                          title={canLink ? (isLinkedToActive ? "Unlink from active" : "Link to active") : "Select active combatant first"}
                          className={`shrink-0 rounded p-1 transition-colors ${canLink ? "hover:bg-zinc-200 dark:hover:bg-zinc-700" : "cursor-default opacity-50"}`}
                          aria-label={isLinkedToActive ? `${name} linked to active` : `Link ${name} to active combatant`}
                        >
                          <FontAwesomeIcon
                            icon={faLink}
                            className={`text-xs ${isLinkedToActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => !incapacitatedIds.has(id) && removeFromCombatants(id)}
                          className="rounded p-1 transition-colors hover:opacity-80"
                          title={isIncapacitated ? "Incapacitated" : "Mark incapacitated"}
                          aria-label={isIncapacitated ? `${name} is incapacitated` : `Mark ${name} incapacitated`}
                        >
                          <FontAwesomeIcon
                            icon={faSkull}
                            className={`text-sm ${isIncapacitated ? "text-red-700 opacity-60 dark:text-red-800 dark:opacity-60" : "text-zinc-500 dark:text-zinc-400 hover:text-red-900 dark:hover:text-red-950"}`}
                          />
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <label className="flex items-center gap-1">
                          <span className="sr-only">Initiative for {name}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-14 rounded border border-zinc-300 bg-white px-2 py-1 text-right text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            value={initiatives[id] ?? ""}
                            onChange={(e) => setInitiative(id, e.target.value)}
                            placeholder="—"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => addCharacterToCombatants(id, name)}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Opponent detail modal (Combat phase, left-panel opponents) */}
        {opponentDetailId && phase === "Combat" ? (() => {
          const fallback = opponentParticipants.find((p) => p.id === opponentDetailId)?.opponent;
          const opp = fullOpponent ?? fallback;
          if (!fallback) return null;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="opponent-detail-title"
            >
              <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <h2 id="opponent-detail-title" className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                  {opp?.name ?? fallback.name}
                </h2>
                {fullOpponentLoading ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading opponent…</p>
                ) : fullOpponentError ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">{fullOpponentError}</p>
                ) : opp ? (
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="font-medium text-zinc-500 dark:text-zinc-400">Type</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">{opp.type}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500 dark:text-zinc-400">Alignment</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">{opp.alignment}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500 dark:text-zinc-400">Hit points</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">{opp.hitPoints}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500 dark:text-zinc-400">Armor class</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">{opp.armorClass}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500 dark:text-zinc-400">Initiative bonus</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">{opp.initiativeBonus ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500 dark:text-zinc-400">Ability scores</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">
                        STR {opp.strength ?? 11}, DEX {opp.dexterity ?? 11}, CON {opp.constitution ?? 11}, INT {opp.intelligence ?? 11}, WIS {opp.wisdom ?? 11}, CHA {opp.charisma ?? 11}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500 dark:text-zinc-400">Saving throws</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">
                        {[
                          { label: "Reflex", bonus: opp.savingThrowDex ?? 0 },
                          { label: "Fortitude", bonus: opp.savingThrowCon ?? 0 },
                          { label: "Will", bonus: opp.savingThrowWis ?? 0 },
                        ].map(({ label, bonus }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              dispatch(setSides(20));
                              dispatch(setCount(1));
                              dispatch(setPerDieBonus(bonus));
                              dispatch(setTotalBonus(0));
                              dispatch(setResults([]));
                              setDiceModalOpen(true);
                            }}
                            className="mr-2 rounded px-1.5 py-0.5 font-medium text-zinc-800 underline-offset-2 hover:bg-zinc-200 hover:underline dark:text-zinc-200 dark:hover:bg-zinc-700"
                          >
                            {label} {bonus}
                          </button>
                        ))}
                      </dd>
                    </div>
                    {opp.actions?.length > 0 ? (
                      <div>
                        <dt className="font-medium text-zinc-500 dark:text-zinc-400">Actions</dt>
                        <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
                          <ul className="list-inside list-disc space-y-0.5">
                            {opp.actions.map((action, i) => (
                              <li key={i}>
                                {formatActionLabel(action)}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpponentDetailId(null)}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })() : null}

        {/* Status popup (Combat phase) */}
        {statusPopupId && phase === "Combat" ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-popup-title"
          >
            <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <h2 id="status-popup-title" className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Status — {combatants.find((c) => c.id === statusPopupId)?.name ?? opponentParticipants.find((p) => p.id === statusPopupId)?.name ?? characterParticipants.find((p) => p.id === statusPopupId)?.name ?? "Combatant"}
              </h2>
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { key: "snooze" as const, icon: faMoon, label: "Sleeping" },
                  { key: "poison" as const, icon: faFlaskVial, label: "Poisoned" },
                  { key: "paperPlane" as const, icon: faPaperPlane, label: "Flying" },
                  { key: "invisible" as const, icon: faUserSecret, label: "Invisible" },
                ].map(({ key, icon, label }) => {
                  const active = !!specialStatuses[statusPopupId]?.[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSpecialStatuses((prev) => ({
                          ...prev,
                          [statusPopupId]: { ...prev[statusPopupId], [key]: !active },
                        }))
                      }
                      title={active ? `Remove ${label}` : `Set ${label}`}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300"
                          : "border-zinc-300 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <FontAwesomeIcon icon={icon} className="mr-1.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={statusInfo[statusPopupId] ?? ""}
                onChange={(e) => setStatusInfo((prev) => ({ ...prev, [statusPopupId]: e.target.value }))}
                className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                rows={4}
                placeholder="Add status notes…"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusPopupId(null)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setStatusPopupId(null)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Dice roller modal */}
        {diceModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Dice roller"
          >
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setDiceModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <DiceRoller />
            </div>
          </div>
        ) : null}

        {/* Attack roller modal */}
        {attackModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Attack roller"
          >
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setAttackModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <AttackRoller />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

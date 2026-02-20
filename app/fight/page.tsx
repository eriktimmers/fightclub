"use client";

import { useState, useEffect, useCallback } from "react";

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
  actions: string[];
  hitPoints: number;
  armorClass: number;
  initiativeBonus?: number;
};

type Encounter = {
  _id: string;
  name: string;
  opponents: Opponent[];
};

const PHASES = ["Initiative", "Combat", "Resolution"] as const;
type Phase = (typeof PHASES)[number];

export default function FightPage() {
  const [phase, setPhase] = useState<Phase>("Initiative");
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [initiatives, setInitiatives] = useState<Record<string, string>>({});
  const [combatants, setCombatants] = useState<{ id: string; name: string; initiative: number }[]>([]);
  const [loadingEncounters, setLoadingEncounters] = useState(true);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  const selectedEncounter = selectedEncounterId
    ? encounters.find((e) => e._id === selectedEncounterId) ?? null
    : null;
  const opponents = selectedEncounter?.opponents ?? [];

  useEffect(() => {
    setCombatants([]);
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

  const characterParticipants = characters.map((c) => ({
    id: `char-${c._id}`,
    name: c.name,
  }));

  const opponentParticipants = opponents.map((o, i) => ({
    id: `opp-${selectedEncounterId}-${i}`,
    name: o.name,
    initiativeBonus: o.initiativeBonus ?? 0,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Fight!
        </h1>
        <div className="mb-4 flex gap-2">
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,280px)_1fr_minmax(280px,360px)]">
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
                    {opponentParticipants.map(({ id, name, initiativeBonus }) => (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {name}
                        </span>
                        {phase === "Initiative" ? (
                          <button
                            type="button"
                            onClick={() => rollInitiative(id, name, initiativeBonus)}
                            className="shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                          >
                            Roll
                          </button>
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
                    ))}
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

          {/* Middle: Combatants in initiative order */}
          <section className="flex min-h-[320px] flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {phase === "Initiative" ? "Combatants" : phase}
            </h2>
            {phase === "Initiative" && combatants.length > 0 ? (
              <ul className="space-y-2">
                {combatants.map(({ id, name, initiative }) => (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {name}
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums font-medium text-zinc-600 dark:text-zinc-400">
                      {initiative}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/30">
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {phase === "Initiative"
                    ? "Roll initiative for opponents to add them here (highest first)"
                    : "(Reserved for later use)"}
                </span>
              </div>
            )}
          </section>

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
                {characterParticipants.map(({ id, name }) => (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {name}
                    </span>
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
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { OpponentAction } from "@/lib/types/actions";

type Opponent = {
  _id: string;
  name: string;
  type: string;
  alignment: string;
  actions: OpponentAction[] | string[];
  hitPoints: number;
  armorClass: number;
  initiativeBonus?: number;
};

type Encounter = {
  _id: string;
  name: string;
  opponents: Opponent[];
  updatedAt?: string;
};

const ENCOUNTER_NAME_KEY = "fightclub-encounter-name";
const ENCOUNTER_OPPONENTS_KEY = "fightclub-encounter-opponents";

export default function EncountersPage() {
  const [encounterName, setEncounterName] = useState("");
  const [encounterOpponents, setEncounterOpponents] = useState<Opponent[]>([]);
  const [availableOpponents, setAvailableOpponents] = useState<Opponent[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingEncounter, setLoadingEncounter] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadEncounter = useCallback((enc: Encounter) => {
    setEncounterName(enc.name);
    setEncounterOpponents(enc.opponents ?? []);
    setSelectedEncounterId(enc._id);
  }, []);

  useEffect(() => {
    fetch("/api/opponents")
      .then((res) => res.json())
      .then((data) => {
        setAvailableOpponents(Array.isArray(data) ? data : []);
      })
      .catch(() => setAvailableOpponents([]))
      .finally(() => setLoading(false));
  }, []);

  const fetchEncounters = useCallback(() => {
    fetch("/api/encounters")
      .then((res) => res.json())
      .then((data) => {
        setEncounters(Array.isArray(data) ? data : []);
      })
      .catch(() => setEncounters([]));
  }, []);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  useEffect(() => {
    if (selectedEncounterId) return;
    const savedName = localStorage.getItem(ENCOUNTER_NAME_KEY);
    const saved = localStorage.getItem(ENCOUNTER_OPPONENTS_KEY);
    if (savedName != null) setEncounterName(savedName);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Opponent[];
        if (Array.isArray(parsed)) setEncounterOpponents(parsed);
      } catch {
        // ignore
      }
    }
  }, [selectedEncounterId]);

  useEffect(() => {
    if (selectedEncounterId) return;
    localStorage.setItem(ENCOUNTER_NAME_KEY, encounterName);
  }, [selectedEncounterId, encounterName]);

  useEffect(() => {
    if (selectedEncounterId) return;
    localStorage.setItem(
      ENCOUNTER_OPPONENTS_KEY,
      JSON.stringify(encounterOpponents)
    );
  }, [selectedEncounterId, encounterOpponents]);

  useEffect(() => {
    if (!selectedEncounterId) return;
    setLoadingEncounter(true);
    fetch(`/api/encounters/${selectedEncounterId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((enc: Encounter) => {
        setEncounterName(enc.name);
        setEncounterOpponents(enc.opponents ?? []);
      })
      .catch(() => setSaveError("Failed to load encounter"))
      .finally(() => setLoadingEncounter(false));
  }, [selectedEncounterId]);

  const handleNewEncounter = useCallback(() => {
    setSelectedEncounterId(null);
    const savedName = localStorage.getItem(ENCOUNTER_NAME_KEY);
    const saved = localStorage.getItem(ENCOUNTER_OPPONENTS_KEY);
    setEncounterName(savedName ?? "");
    try {
      setEncounterOpponents(
        saved ? (JSON.parse(saved) as Opponent[]) : []
      );
    } catch {
      setEncounterOpponents([]);
    }
    setSaveStatus("idle");
    setSaveError(null);
  }, []);

  const handleDeleteEncounter = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      fetch(`/api/encounters/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete");
          fetchEncounters();
          if (selectedEncounterId === id) handleNewEncounter();
        })
        .catch(() => setSaveError("Failed to delete encounter"));
    },
    [selectedEncounterId, fetchEncounters, handleNewEncounter]
  );

  const handleSave = useCallback(() => {
    const name = encounterName.trim();
    if (!name) {
      setSaveError("Enter an encounter name");
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saving");
    setSaveError(null);
    const body = {
      name,
      opponents: encounterOpponents.map((o) => ({
        _id: o._id,
        name: o.name,
        type: o.type,
        alignment: o.alignment,
        actions: o.actions ?? [],
        hitPoints: o.hitPoints,
        armorClass: o.armorClass,
        initiativeBonus: o.initiativeBonus ?? 0,
      })),
    };
    const url = selectedEncounterId
      ? `/api/encounters/${selectedEncounterId}`
      : "/api/encounters";
    const method = selectedEncounterId ? "PATCH" : "POST";
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d));
        return res.json();
      })
      .then((enc: Encounter) => {
        setSaveStatus("saved");
        setSelectedEncounterId(enc._id);
        fetchEncounters();
        setTimeout(() => setSaveStatus("idle"), 2000);
      })
      .catch((err) => {
        setSaveError(err?.error ?? "Failed to save");
        setSaveStatus("error");
      });
  }, [
    encounterName,
    encounterOpponents,
    selectedEncounterId,
    fetchEncounters,
  ]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, opponent: Opponent) => {
      e.dataTransfer.setData("application/json", JSON.stringify(opponent));
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const opponent = JSON.parse(raw) as Opponent;
      if (opponent && typeof opponent._id === "string" && opponent.name) {
        setEncounterOpponents((prev) => [...prev, opponent]);
      }
    } catch {
      // ignore invalid json
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const removeFromEncounter = useCallback((index: number) => {
    setEncounterOpponents((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const inputClass =
    "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
  const labelClass =
    "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const btnClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Encounters
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Left column: saved list, name, opponents box, actions */}
        <div className="flex flex-col gap-6">
          {encounters.length > 0 && (
            <div>
              <label className={labelClass}>Saved encounters</label>
              <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-700 dark:bg-zinc-800/40">
                {encounters.map((enc) => (
                  <li key={enc._id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => loadEncounter(enc)}
                      className={`min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 ${
                        selectedEncounterId === enc._id
                          ? "bg-zinc-200 font-medium dark:bg-zinc-700"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {enc.name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEncounter(e, enc._id)}
                      className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      aria-label={`Delete ${enc.name}`}
                    >
                      <span className="text-lg leading-none">&times;</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="encounter-name" className={labelClass}>
              Encounter name
            </label>
            <input
              id="encounter-name"
              type="text"
              value={encounterName}
              onChange={(e) => setEncounterName(e.target.value)}
              placeholder="e.g. Goblin ambush"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Opponents in this encounter</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`mt-1 min-h-[280px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                dragOver
                  ? "border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-800/80"
                  : "border-zinc-300 bg-zinc-50/50 dark:border-zinc-600 dark:bg-zinc-800/40"
              }`}
            >
              {encounterOpponents.length === 0 && !dragOver && (
                <p className="flex h-[240px] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                  Drag opponents here from the list on the right
                </p>
              )}
              <ul className="flex flex-wrap gap-2">
                {encounterOpponents.map((opp, i) => (
                  <li
                    key={`${opp._id}-${i}`}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <span>
                      {opp.name}
                      <span className="ml-1 text-zinc-500 dark:text-zinc-400">
                        (AC {opp.armorClass}, HP {opp.hitPoints})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromEncounter(i)}
                      className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      aria-label={`Remove ${opp.name}`}
                    >
                      <span className="text-lg leading-none">&times;</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className={`${btnClass} disabled:opacity-50`}
            >
              {saveStatus === "saving"
                ? "Saving…"
                : selectedEncounterId
                  ? "Save changes"
                  : "Save encounter"}
            </button>
            <button type="button" onClick={handleNewEncounter} className={btnClass}>
              New encounter
            </button>
            {saveStatus === "saved" && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Saved
              </span>
            )}
            {saveError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {saveError}
              </span>
            )}
          </div>
        </div>

        {/* Right column: available opponents */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Available opponents
          </h2>
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading…
            </p>
          ) : availableOpponents.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No opponents yet. Add some on the Opponents page.
            </p>
          ) : (
            <ul className="grid max-h-[calc(100vh-12rem)] gap-2 overflow-y-auto pr-1 sm:grid-cols-1">
              {availableOpponents.map((opp) => (
                <li
                  key={opp._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opp)}
                  className="cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow active:cursor-grabbing hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <div className="font-medium">{opp.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {opp.type} · {opp.alignment} · AC {opp.armorClass}, HP{" "}
                    {opp.hitPoints}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

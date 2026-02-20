"use client";

import Link from "next/link";
import { useState } from "react";
import ActionsEditor, {
  normalizeLegacyActions,
} from "@/components/ActionsEditor";
import type { OpponentAction } from "@/lib/types/actions";

const DEFAULT_ABILITY = 11;
const DEFAULT_SAVE = 0;

const DND_ALIGNMENTS = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

function validActions(actions: OpponentAction[]): boolean {
  if (actions.length === 0) return false;
  return actions.some(
    (a) => a.type !== "special" || (a.description?.trim() ?? "").length > 0
  );
}

export default function OpponentsPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [alignment, setAlignment] = useState("");
  const [actions, setActions] = useState<OpponentAction[]>([
    { type: "special", description: "" },
  ]);
  const [hitPoints, setHitPoints] = useState("");
  const [armorClass, setArmorClass] = useState("");
  const [initiativeBonus, setInitiativeBonus] = useState("0");
  const [strength, setStrength] = useState(String(DEFAULT_ABILITY));
  const [dexterity, setDexterity] = useState(String(DEFAULT_ABILITY));
  const [constitution, setConstitution] = useState(String(DEFAULT_ABILITY));
  const [intelligence, setIntelligence] = useState(String(DEFAULT_ABILITY));
  const [wisdom, setWisdom] = useState(String(DEFAULT_ABILITY));
  const [charisma, setCharisma] = useState(String(DEFAULT_ABILITY));
  const [savingThrowDex, setSavingThrowDex] = useState(String(DEFAULT_SAVE));
  const [savingThrowCon, setSavingThrowCon] = useState(String(DEFAULT_SAVE));
  const [savingThrowWis, setSavingThrowWis] = useState(String(DEFAULT_SAVE));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validActions(actions)) {
      setError("At least one action is required (special actions need a description)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/opponents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: type.trim(),
          alignment: alignment.trim(),
          actions,
          hitPoints: Number(hitPoints),
          armorClass: Number(armorClass),
          initiativeBonus: initiativeBonus === "" ? 0 : Number(initiativeBonus),
          strength: strength === "" ? DEFAULT_ABILITY : Number(strength),
          dexterity: dexterity === "" ? DEFAULT_ABILITY : Number(dexterity),
          constitution: constitution === "" ? DEFAULT_ABILITY : Number(constitution),
          intelligence: intelligence === "" ? DEFAULT_ABILITY : Number(intelligence),
          wisdom: wisdom === "" ? DEFAULT_ABILITY : Number(wisdom),
          charisma: charisma === "" ? DEFAULT_ABILITY : Number(charisma),
          savingThrowDex: savingThrowDex === "" ? DEFAULT_SAVE : Number(savingThrowDex),
          savingThrowCon: savingThrowCon === "" ? DEFAULT_SAVE : Number(savingThrowCon),
          savingThrowWis: savingThrowWis === "" ? DEFAULT_SAVE : Number(savingThrowWis),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create opponent");
      }
      setName("");
      setType("");
      setAlignment("");
      setActions([{ type: "special", description: "" }]);
      setHitPoints("");
      setArmorClass("");
      setInitiativeBonus("0");
      setStrength(String(DEFAULT_ABILITY));
      setDexterity(String(DEFAULT_ABILITY));
      setConstitution(String(DEFAULT_ABILITY));
      setIntelligence(String(DEFAULT_ABILITY));
      setWisdom(String(DEFAULT_ABILITY));
      setCharisma(String(DEFAULT_ABILITY));
      setSavingThrowDex(String(DEFAULT_SAVE));
      setSavingThrowCon(String(DEFAULT_SAVE));
      setSavingThrowWis(String(DEFAULT_SAVE));
      window.location.href = "/opponents/list";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Add opponent
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Create a new opponent with name, type, alignment, actions, hit
              points, and armor class.
            </p>
          </div>
          <Link
            href="/opponents/list"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            View all opponents →
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goblin Scout"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="type" className={labelClass}>
                Type
              </label>
              <input
                id="type"
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Humanoid"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="alignment" className={labelClass}>
                Alignment
              </label>
              <select
                id="alignment"
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select alignment</option>
                {DND_ALIGNMENTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <ActionsEditor actions={actions} onChange={setActions} />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="hitPoints" className={labelClass}>
                  Hit Points
                </label>
                <input
                  id="hitPoints"
                  type="number"
                  min={0}
                  value={hitPoints}
                  onChange={(e) => setHitPoints(e.target.value)}
                  placeholder="e.g. 7"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="armorClass" className={labelClass}>
                  Armor Class
                </label>
                <input
                  id="armorClass"
                  type="number"
                  min={0}
                  max={30}
                  value={armorClass}
                  onChange={(e) => setArmorClass(e.target.value)}
                  placeholder="e.g. 13"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="initiativeBonus" className={labelClass}>
                  Initiative bonus
                </label>
                <input
                  id="initiativeBonus"
                  type="number"
                  value={initiativeBonus}
                  onChange={(e) => setInitiativeBonus(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <span className={labelClass}>Ability scores</span>
              <div className="mt-1 grid grid-cols-6 gap-2">
                <div>
                  <label htmlFor="strength" className="sr-only">STR</label>
                  <input id="strength" type="number" min={1} max={30} value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="11" className={inputClass} title="Strength" />
                </div>
                <div>
                  <label htmlFor="dexterity" className="sr-only">DEX</label>
                  <input id="dexterity" type="number" min={1} max={30} value={dexterity} onChange={(e) => setDexterity(e.target.value)} placeholder="11" className={inputClass} title="Dexterity" />
                </div>
                <div>
                  <label htmlFor="constitution" className="sr-only">CON</label>
                  <input id="constitution" type="number" min={1} max={30} value={constitution} onChange={(e) => setConstitution(e.target.value)} placeholder="11" className={inputClass} title="Constitution" />
                </div>
                <div>
                  <label htmlFor="intelligence" className="sr-only">INT</label>
                  <input id="intelligence" type="number" min={1} max={30} value={intelligence} onChange={(e) => setIntelligence(e.target.value)} placeholder="11" className={inputClass} title="Intelligence" />
                </div>
                <div>
                  <label htmlFor="wisdom" className="sr-only">WIS</label>
                  <input id="wisdom" type="number" min={1} max={30} value={wisdom} onChange={(e) => setWisdom(e.target.value)} placeholder="11" className={inputClass} title="Wisdom" />
                </div>
                <div>
                  <label htmlFor="charisma" className="sr-only">CHA</label>
                  <input id="charisma" type="number" min={1} max={30} value={charisma} onChange={(e) => setCharisma(e.target.value)} placeholder="11" className={inputClass} title="Charisma" />
                </div>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">STR, DEX, CON, INT, WIS, CHA (default 11)</p>
            </div>
            <div>
              <span className={labelClass}>Saving throws (bonus)</span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="savingThrowDex" className={labelClass}>Reflex save</label>
                  <input id="savingThrowDex" type="number" value={savingThrowDex} onChange={(e) => setSavingThrowDex(e.target.value)} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="savingThrowCon" className={labelClass}>Fortitude save</label>
                  <input id="savingThrowCon" type="number" value={savingThrowCon} onChange={(e) => setSavingThrowCon(e.target.value)} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="savingThrowWis" className={labelClass}>Will save</label>
                  <input id="savingThrowWis" type="number" value={savingThrowWis} onChange={(e) => setSavingThrowWis(e.target.value)} placeholder="0" className={inputClass} />
                </div>
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Creating…" : "Create Opponent"}
          </button>
        </form>
      </div>
    </div>
  );
}

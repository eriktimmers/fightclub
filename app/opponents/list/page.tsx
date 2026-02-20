"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ActionsEditor, {
  normalizeLegacyActions,
} from "@/components/ActionsEditor";
import type { OpponentAction } from "@/lib/types/actions";

const DEFAULT_ABILITY = 11;
const DEFAULT_SAVE = 0;

type Opponent = {
  _id: string;
  name: string;
  type: string;
  alignment: string;
  actions: OpponentAction[] | string[];
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
  createdAt: string;
};

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

export default function OpponentsListPage() {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editAlignment, setEditAlignment] = useState("");
  const [editActions, setEditActions] = useState<OpponentAction[]>([
    { type: "special", description: "" },
  ]);
  const [editHitPoints, setEditHitPoints] = useState("");
  const [editArmorClass, setEditArmorClass] = useState("");
  const [editInitiativeBonus, setEditInitiativeBonus] = useState("0");
  const [editStrength, setEditStrength] = useState(String(DEFAULT_ABILITY));
  const [editDexterity, setEditDexterity] = useState(String(DEFAULT_ABILITY));
  const [editConstitution, setEditConstitution] = useState(String(DEFAULT_ABILITY));
  const [editIntelligence, setEditIntelligence] = useState(String(DEFAULT_ABILITY));
  const [editWisdom, setEditWisdom] = useState(String(DEFAULT_ABILITY));
  const [editCharisma, setEditCharisma] = useState(String(DEFAULT_ABILITY));
  const [editSavingThrowDex, setEditSavingThrowDex] = useState(String(DEFAULT_SAVE));
  const [editSavingThrowCon, setEditSavingThrowCon] = useState(String(DEFAULT_SAVE));
  const [editSavingThrowWis, setEditSavingThrowWis] = useState(String(DEFAULT_SAVE));
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOpponents = async () => {
    try {
      const res = await fetch("/api/opponents");
      if (!res.ok) throw new Error("Failed to load opponents");
      const data = await res.json();
      setOpponents(
        (data as Opponent[]).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load opponents");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchOpponents();
  }, []);

  const startEdit = (o: Opponent) => {
    setEditingId(o._id);
    setEditName(o.name);
    setEditType(o.type);
    setEditAlignment(o.alignment);
    setEditActions(
      o.actions.length > 0 ? normalizeLegacyActions(o.actions) : [{ type: "special", description: "" }]
    );
    setEditHitPoints(String(o.hitPoints));
    setEditArmorClass(String(o.armorClass));
    setEditInitiativeBonus(String(o.initiativeBonus ?? 0));
    setEditStrength(String(o.strength ?? DEFAULT_ABILITY));
    setEditDexterity(String(o.dexterity ?? DEFAULT_ABILITY));
    setEditConstitution(String(o.constitution ?? DEFAULT_ABILITY));
    setEditIntelligence(String(o.intelligence ?? DEFAULT_ABILITY));
    setEditWisdom(String(o.wisdom ?? DEFAULT_ABILITY));
    setEditCharisma(String(o.charisma ?? DEFAULT_ABILITY));
    setEditSavingThrowDex(String(o.savingThrowDex ?? DEFAULT_SAVE));
    setEditSavingThrowCon(String(o.savingThrowCon ?? DEFAULT_SAVE));
    setEditSavingThrowWis(String(o.savingThrowWis ?? DEFAULT_SAVE));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditType("");
    setEditAlignment("");
    setEditActions([{ type: "special", description: "" }]);
    setEditHitPoints("");
    setEditArmorClass("");
    setEditInitiativeBonus("0");
    setEditStrength(String(DEFAULT_ABILITY));
    setEditDexterity(String(DEFAULT_ABILITY));
    setEditConstitution(String(DEFAULT_ABILITY));
    setEditIntelligence(String(DEFAULT_ABILITY));
    setEditWisdom(String(DEFAULT_ABILITY));
    setEditCharisma(String(DEFAULT_ABILITY));
    setEditSavingThrowDex(String(DEFAULT_SAVE));
    setEditSavingThrowCon(String(DEFAULT_SAVE));
    setEditSavingThrowWis(String(DEFAULT_SAVE));
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    if (!validActions(editActions)) {
      setError("At least one action is required (special actions need a description)");
      return;
    }
    setActionLoading(editingId);
    try {
      const res = await fetch(`/api/opponents/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          type: editType.trim(),
          alignment: editAlignment.trim(),
          actions: editActions,
          hitPoints: Number(editHitPoints),
          armorClass: Number(editArmorClass),
          initiativeBonus:
            editInitiativeBonus === "" ? 0 : Number(editInitiativeBonus),
          strength: editStrength === "" ? DEFAULT_ABILITY : Number(editStrength),
          dexterity: editDexterity === "" ? DEFAULT_ABILITY : Number(editDexterity),
          constitution: editConstitution === "" ? DEFAULT_ABILITY : Number(editConstitution),
          intelligence: editIntelligence === "" ? DEFAULT_ABILITY : Number(editIntelligence),
          wisdom: editWisdom === "" ? DEFAULT_ABILITY : Number(editWisdom),
          charisma: editCharisma === "" ? DEFAULT_ABILITY : Number(editCharisma),
          savingThrowDex: editSavingThrowDex === "" ? DEFAULT_SAVE : Number(editSavingThrowDex),
          savingThrowCon: editSavingThrowCon === "" ? DEFAULT_SAVE : Number(editSavingThrowCon),
          savingThrowWis: editSavingThrowWis === "" ? DEFAULT_SAVE : Number(editSavingThrowWis),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update opponent");
      }
      cancelEdit();
      await fetchOpponents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, opponentName: string) => {
    if (!confirm(`Delete "${opponentName}"? This cannot be undone.`)) return;
    setError(null);
    setActionLoading(id);
    try {
      const res = await fetch(`/api/opponents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete opponent");
      }
      await fetchOpponents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Opponents
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              View and manage saved opponents.
            </p>
          </div>
          <Link
            href="/opponents"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add opponent
          </Link>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <section className="mt-8">
          {listLoading ? (
            <p className="text-zinc-500">Loading…</p>
          ) : opponents.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No opponents yet.{" "}
              <Link href="/opponents" className="text-zinc-700 underline dark:text-zinc-300">
                Create one
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {opponents.map((o) => (
                <li
                  key={o._id}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {editingId === o._id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        placeholder="Type"
                        className={inputClass}
                      />
                      <select
                        value={editAlignment}
                        onChange={(e) => setEditAlignment(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select alignment</option>
                        {editAlignment &&
                          !DND_ALIGNMENTS.includes(editAlignment) && (
                            <option value={editAlignment}>{editAlignment}</option>
                          )}
                        {DND_ALIGNMENTS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <ActionsEditor
                        actions={editActions}
                        onChange={setEditActions}
                        disabled={actionLoading === o._id}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min={0}
                          value={editHitPoints}
                          onChange={(e) => setEditHitPoints(e.target.value)}
                          placeholder="HP"
                          className={inputClass}
                        />
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={editArmorClass}
                          onChange={(e) => setEditArmorClass(e.target.value)}
                          placeholder="AC"
                          className={inputClass}
                        />
                        <input
                          type="number"
                          value={editInitiativeBonus}
                          onChange={(e) => setEditInitiativeBonus(e.target.value)}
                          placeholder="Init"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        <input type="number" min={1} max={30} value={editStrength} onChange={(e) => setEditStrength(e.target.value)} placeholder="STR" className={inputClass} title="Strength" />
                        <input type="number" min={1} max={30} value={editDexterity} onChange={(e) => setEditDexterity(e.target.value)} placeholder="DEX" className={inputClass} title="Dexterity" />
                        <input type="number" min={1} max={30} value={editConstitution} onChange={(e) => setEditConstitution(e.target.value)} placeholder="CON" className={inputClass} title="Constitution" />
                        <input type="number" min={1} max={30} value={editIntelligence} onChange={(e) => setEditIntelligence(e.target.value)} placeholder="INT" className={inputClass} title="Intelligence" />
                        <input type="number" min={1} max={30} value={editWisdom} onChange={(e) => setEditWisdom(e.target.value)} placeholder="WIS" className={inputClass} title="Wisdom" />
                        <input type="number" min={1} max={30} value={editCharisma} onChange={(e) => setEditCharisma(e.target.value)} placeholder="CHA" className={inputClass} title="Charisma" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Reflex save</label>
                          <input type="number" value={editSavingThrowDex} onChange={(e) => setEditSavingThrowDex(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Fortitude save</label>
                          <input type="number" value={editSavingThrowCon} onChange={(e) => setEditSavingThrowCon(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Will save</label>
                          <input type="number" value={editSavingThrowWis} onChange={(e) => setEditSavingThrowWis(e.target.value)} className={inputClass} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={actionLoading === o._id}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          {actionLoading === o._id ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={actionLoading === o._id}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {o.name}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {o.alignment}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          HP {o.hitPoints}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          AC {o.armorClass}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(o)}
                          disabled={!!actionLoading}
                          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(o._id, o.name)}
                          disabled={!!actionLoading}
                          className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

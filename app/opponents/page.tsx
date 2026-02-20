"use client";

import { useState, useEffect } from "react";

type Opponent = {
  _id: string;
  name: string;
  type: string;
  alignment: string;
  actions: string[];
  hitPoints: number;
  armorClass: number;
  initiativeBonus?: number;
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

function ActionsEditor({
  actions,
  onChange,
  disabled,
}: {
  actions: string[];
  onChange: (actions: string[]) => void;
  disabled?: boolean;
}) {
  const add = () => onChange([...actions, ""]);
  const remove = (i: number) =>
    onChange(actions.filter((_, idx) => idx !== i));
  const set = (i: number, v: string) =>
    onChange(actions.map((a, idx) => (idx === i ? v : a)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelClass}>Actions</label>
        <button
          type="button"
          onClick={add}
          disabled={disabled || actions.length >= 20}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-50"
        >
          + Add action
        </button>
      </div>
      {actions.map((a, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={a}
            onChange={(e) => set(i, e.target.value)}
            placeholder={`Action ${i + 1}`}
            className={inputClass}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled || actions.length <= 1}
            className="shrink-0 rounded-lg border border-zinc-300 px-2.5 py-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default function OpponentsPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [alignment, setAlignment] = useState("");
  const [actions, setActions] = useState<string[]>([""]);
  const [hitPoints, setHitPoints] = useState("");
  const [armorClass, setArmorClass] = useState("");
  const [initiativeBonus, setInitiativeBonus] = useState("0");
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editAlignment, setEditAlignment] = useState("");
  const [editActions, setEditActions] = useState<string[]>([""]);
  const [editHitPoints, setEditHitPoints] = useState("");
  const [editArmorClass, setEditArmorClass] = useState("");
  const [editInitiativeBonus, setEditInitiativeBonus] = useState("0");
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

  const validActions = (arr: string[]) =>
    arr.filter((a) => a.trim() !== "").length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validActions(actions)) {
      setError("At least one action is required");
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
          actions: actions.map((a) => a.trim()).filter(Boolean),
          hitPoints: Number(hitPoints),
          armorClass: Number(armorClass),
          initiativeBonus: initiativeBonus === "" ? 0 : Number(initiativeBonus),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create opponent");
      }
      setName("");
      setType("");
      setAlignment("");
      setActions([""]);
      setHitPoints("");
      setArmorClass("");
      setInitiativeBonus("0");
      await fetchOpponents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (o: Opponent) => {
    setEditingId(o._id);
    setEditName(o.name);
    setEditType(o.type);
    setEditAlignment(o.alignment);
    setEditActions(
      o.actions.length > 0 ? o.actions : [""]
    );
    setEditHitPoints(String(o.hitPoints));
    setEditArmorClass(String(o.armorClass));
    setEditInitiativeBonus(String(o.initiativeBonus ?? 0));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditType("");
    setEditAlignment("");
    setEditActions([""]);
    setEditHitPoints("");
    setEditArmorClass("");
    setEditInitiativeBonus("0");
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    if (!validActions(editActions)) {
      setError("At least one action is required");
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
          actions: editActions.map((a) => a.trim()).filter(Boolean),
          hitPoints: Number(editHitPoints),
          armorClass: Number(editArmorClass),
          initiativeBonus:
            editInitiativeBonus === "" ? 0 : Number(editInitiativeBonus),
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Opponents
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Add and edit opponents with name, type, alignment, actions, hit
          points, and armor class.
        </p>

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

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Saved opponents
          </h2>
          {listLoading ? (
            <p className="mt-4 text-zinc-500">Loading…</p>
          ) : opponents.length === 0 ? (
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              No opponents yet. Create one above.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
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

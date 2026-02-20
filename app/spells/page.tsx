"use client";

import { useState, useEffect } from "react";

type Spell = {
  _id: string;
  type: string;
  level: number;
  name: string;
  description: string;
  createdAt: string;
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function SpellsPage() {
  const [type, setType] = useState<"priest" | "wizard">("wizard");
  const [level, setLevel] = useState("0");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSpells = async () => {
    try {
      const res = await fetch("/api/spells");
      if (!res.ok) throw new Error("Failed to load spells");
      const data = await res.json();
      setSpells(
        (data as Spell[]).sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          if (a.level !== b.level) return a.level - b.level;
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load spells");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchSpells();
  }, []);

  const startEdit = (s: Spell) => {
    setEditingId(s._id);
    setType((s.type as "priest" | "wizard") || "wizard");
    setLevel(String(s.level));
    setName(s.name);
    setDescription(s.description ?? "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setLevel("0");
    setName("");
    setDescription("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        type,
        level: Number(level),
        name: name.trim(),
        description: description.trim(),
      };
      const url = editingId ? `/api/spells/${editingId}` : "/api/spells";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? (editingId ? "Failed to update spell" : "Failed to create spell"));
      }
      cancelEdit();
      await fetchSpells();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, spellName: string) => {
    if (!confirm(`Delete "${spellName}"? This cannot be undone.`)) return;
    setError(null);
    setActionLoading(id);
    try {
      const res = await fetch(`/api/spells/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete spell");
      }
      if (editingId === id) cancelEdit();
      await fetchSpells();
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
          Spells
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {editingId
            ? "Edit the spell below and save, or cancel to add a new one."
            : "Add spells to the database. Type can be priest or wizard. Click Edit on a spell to change it."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="type" className={labelClass}>
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as "priest" | "wizard")}
                className={inputClass}
                required
              >
                <option value="priest">Priest</option>
                <option value="wizard">Wizard</option>
              </select>
            </div>
            <div>
              <label htmlFor="level" className={labelClass}>
                Level
              </label>
              <input
                id="level"
                type="number"
                min={0}
                max={9}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Magic Missile"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Spell description..."
                className={inputClass}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {loading
                  ? editingId
                    ? "Saving…"
                    : "Adding…"
                  : editingId
                    ? "Save spell"
                    : "Add spell"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Spells in database
          </h2>
          {listLoading ? (
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : spells.length === 0 ? (
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              No spells yet. Add one above.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {spells.map((s) => (
                <li
                  key={s._id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {s.name}
                    </span>{" "}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      ({s.type}, level {s.level})
                    </span>
                    {s.description && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      disabled={!!actionLoading}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s._id, s.name)}
                      disabled={!!actionLoading}
                      className="rounded-lg border border-red-200 px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {actionLoading === s._id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

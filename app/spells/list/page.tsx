"use client";

import Link from "next/link";
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

export default function SpellsListPage() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"priest" | "wizard">("wizard");
  const [editLevel, setEditLevel] = useState("0");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
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
    setEditType((s.type as "priest" | "wizard") || "wizard");
    setEditLevel(String(s.level));
    setEditName(s.name);
    setEditDescription(s.description ?? "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLevel("0");
    setEditName("");
    setEditDescription("");
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    setActionLoading(editingId);
    try {
      const res = await fetch(`/api/spells/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          level: Number(editLevel),
          name: editName.trim(),
          description: editDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update spell");
      }
      cancelEdit();
      await fetchSpells();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActionLoading(null);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Spells
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              View and manage spells in the database.
            </p>
          </div>
          <Link
            href="/spells"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add spell
          </Link>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <section className="mt-8">
          {listLoading ? (
            <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : spells.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No spells yet.{" "}
              <Link href="/spells" className="text-zinc-700 underline dark:text-zinc-300">
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {spells.map((s) => (
                <li
                  key={s._id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {editingId === s._id ? (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as "priest" | "wizard")}
                          className={inputClass}
                        >
                          <option value="priest">Priest</option>
                          <option value="wizard">Wizard</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Level</label>
                        <input
                          type="number"
                          min={0}
                          max={9}
                          value={editLevel}
                          onChange={(e) => setEditLevel(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. Magic Missile"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                          rows={4}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Spell description..."
                          className={inputClass}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={actionLoading === s._id}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          {actionLoading === s._id ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={actionLoading === s._id}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
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

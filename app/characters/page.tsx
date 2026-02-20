"use client";

import { useState, useEffect } from "react";

type Character = {
  _id: string;
  name: string;
  armorClass: number;
  createdAt: string;
};

export default function CharactersPage() {
  const [name, setName] = useState("");
  const [armorClass, setArmorClass] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editArmorClass, setEditArmorClass] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      if (!res.ok) throw new Error("Failed to load characters");
      const data = await res.json();
      setCharacters(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load characters");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          armorClass: Number(armorClass),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create character");
      }
      setName("");
      setArmorClass("");
      await fetchCharacters();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (c: Character) => {
    setEditingId(c._id);
    setEditName(c.name);
    setEditArmorClass(String(c.armorClass));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditArmorClass("");
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    setActionLoading(editingId);
    try {
      const res = await fetch(`/api/characters/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          armorClass: Number(editArmorClass),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update character");
      }
      cancelEdit();
      await fetchCharacters();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, characterName: string) => {
    if (!confirm(`Delete "${characterName}"? This cannot be undone.`)) return;
    setError(null);
    setActionLoading(id);
    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete character");
      }
      await fetchCharacters();
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
          Characters
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create and manage characters with name and armor class.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gandalf"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label
                htmlFor="armorClass"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Armor Class
              </label>
              <input
                id="armorClass"
                type="number"
                min={0}
                max={30}
                value={armorClass}
                onChange={(e) => setArmorClass(e.target.value)}
                placeholder="e.g. 15"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Creating…" : "Create Character"}
          </button>
        </form>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Saved characters
          </h2>
          {listLoading ? (
            <p className="mt-4 text-zinc-500">Loading…</p>
          ) : characters.length === 0 ? (
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">
              No characters yet. Create one above.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {characters.map((c) => (
                <li
                  key={c._id}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {editingId === c._id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={editArmorClass}
                        onChange={(e) => setEditArmorClass(e.target.value)}
                        placeholder="AC"
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={actionLoading === c._id}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          {actionLoading === c._id ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={actionLoading === c._id}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {c.name}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          AC {c.armorClass}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          disabled={!!actionLoading}
                          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c._id, c.name)}
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

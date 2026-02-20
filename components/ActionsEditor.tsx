"use client";

import { useState, useEffect } from "react";
import type {
  OpponentAction,
  ActionType,
  MeleeAction,
  RangedAction,
  SpellAction,
  SpecialAction,
} from "@/lib/types/actions";
import { ACTION_TYPES } from "@/lib/types/actions";

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

type SpellOption = { _id: string; name: string };

function defaultAction(type: ActionType): OpponentAction {
  switch (type) {
    case "melee":
      return { type: "melee" };
    case "ranged":
      return { type: "ranged" };
    case "spell":
      return { type: "spell" };
    case "special":
      return { type: "special" };
  }
}

export function normalizeLegacyActions(
  raw: unknown
): OpponentAction[] {
  if (!Array.isArray(raw)) return [{ type: "special", description: "" }];
  return raw.map((a) =>
    typeof a === "string"
      ? { type: "special" as const, description: a || undefined }
      : (a as OpponentAction)
  );
}

export default function ActionsEditor({
  actions,
  onChange,
  disabled,
}: {
  actions: OpponentAction[];
  onChange: (actions: OpponentAction[]) => void;
  disabled?: boolean;
}) {
  const [spells, setSpells] = useState<SpellOption[]>([]);

  useEffect(() => {
    fetch("/api/spells")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSpells(Array.isArray(data) ? data : []))
      .catch(() => setSpells([]));
  }, []);

  const add = () =>
    onChange([...actions, { type: "special", description: "" }]);
  const remove = (i: number) =>
    onChange(actions.filter((_, idx) => idx !== i));
  const setAction = (i: number, next: OpponentAction) =>
    onChange(actions.map((a, idx) => (idx === i ? next : a)));
  const setType = (i: number, type: ActionType) =>
    setAction(i, defaultAction(type));

  return (
    <div className="space-y-4">
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
        <div
          key={i}
          className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <select
              value={a.type}
              onChange={(e) => setType(i, e.target.value as ActionType)}
              disabled={disabled}
              className={inputClass}
              style={{ width: "auto", minWidth: "8rem" }}
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled || actions.length <= 1}
              className="rounded-lg border border-zinc-300 px-2.5 py-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Remove
            </button>
          </div>
          {a.type === "melee" && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Attack bonus</label>
                <input
                  type="number"
                  value={(a as MeleeAction).attackBonus ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAction(i, {
                      ...a,
                      attackBonus: v === "" ? undefined : Number(v),
                    });
                  }}
                  placeholder="e.g. 5"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelClass}>Critical range</label>
                <input
                  type="text"
                  value={(a as MeleeAction).criticalRange ?? ""}
                  onChange={(e) =>
                    setAction(i, { ...a, criticalRange: e.target.value || undefined })
                  }
                  placeholder="e.g. 19-20"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelClass}>Damage</label>
                <input
                  type="text"
                  value={(a as MeleeAction).damage ?? ""}
                  onChange={(e) =>
                    setAction(i, { ...a, damage: e.target.value || undefined })
                  }
                  placeholder="e.g. 2d6+3"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
          {a.type === "ranged" && (
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={labelClass}>Attack bonus</label>
                <input
                  type="number"
                  value={(a as RangedAction).attackBonus ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAction(i, {
                      ...a,
                      attackBonus: v === "" ? undefined : Number(v),
                    });
                  }}
                  placeholder="e.g. 5"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelClass}>Critical range</label>
                <input
                  type="text"
                  value={(a as RangedAction).criticalRange ?? ""}
                  onChange={(e) =>
                    setAction(i, { ...a, criticalRange: e.target.value || undefined })
                  }
                  placeholder="e.g. 19-20"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelClass}>Damage</label>
                <input
                  type="text"
                  value={(a as RangedAction).damage ?? ""}
                  onChange={(e) =>
                    setAction(i, { ...a, damage: e.target.value || undefined })
                  }
                  placeholder="e.g. 1d8+3"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelClass}>Range</label>
                <input
                  type="text"
                  value={(a as RangedAction).range ?? ""}
                  onChange={(e) =>
                    setAction(i, { ...a, range: e.target.value || undefined })
                  }
                  placeholder="e.g. 30/120"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
          {a.type === "spell" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Spell</label>
                <select
                  value={(a as SpellAction).spellId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || undefined;
                    const spell = spells.find((s) => s._id === id);
                    setAction(i, {
                      ...a,
                      spellId: id,
                      spellName: spell?.name,
                    });
                  }}
                  className={inputClass}
                  disabled={disabled}
                >
                  <option value="">— Select spell —</option>
                  {spells.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Damage</label>
                <input
                  type="text"
                  value={(a as SpellAction).damage ?? ""}
                  onChange={(e) =>
                    setAction(i, { ...a, damage: e.target.value || undefined })
                  }
                  placeholder="e.g. 8d6"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelClass}>Saving throw</label>
                <input
                  type="text"
                  value={(a as SpellAction).savingThrow ?? ""}
                  onChange={(e) =>
                    setAction(i, {
                      ...a,
                      savingThrow: e.target.value || undefined,
                    })
                  }
                  placeholder="e.g. DC 15 Dex"
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
          {a.type === "special" && (
            <div>
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={(a as SpecialAction).description ?? ""}
                onChange={(e) =>
                  setAction(i, {
                    ...a,
                    description: e.target.value || undefined,
                  })
                }
                placeholder="e.g. Nimble Escape"
                className={inputClass}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

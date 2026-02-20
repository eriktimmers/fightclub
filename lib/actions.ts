import mongoose from "mongoose";
import type { OpponentAction } from "@/lib/types/actions";

const ACTION_TYPES = ["melee", "ranged", "spell", "special"] as const;

function isLegacyAction(a: unknown): a is string {
  return typeof a === "string";
}

function validateMelee(o: Record<string, unknown>): boolean {
  return o.type === "melee";
}

function validateRanged(o: Record<string, unknown>): boolean {
  return o.type === "ranged";
}

function validateSpell(o: Record<string, unknown>): boolean {
  if (o.type !== "spell") return false;
  if (o.spellId !== undefined && o.spellId !== null) {
    return mongoose.Types.ObjectId.isValid(String(o.spellId));
  }
  return true;
}

function validateSpecial(o: Record<string, unknown>): boolean {
  return o.type === "special";
}

function parseNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function parseString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function normalizeAction(a: unknown): OpponentAction | null {
  if (isLegacyAction(a)) {
    return { type: "special", description: a.trim() || undefined };
  }
  const o = a as Record<string, unknown>;
  if (!o || typeof o !== "object" || typeof o.type !== "string") return null;
  if (!ACTION_TYPES.includes(o.type as (typeof ACTION_TYPES)[number]))
    return null;

  switch (o.type) {
    case "melee":
      if (!validateMelee(o)) return null;
      return {
        type: "melee",
        name: parseString(o.name),
        attackBonus: parseNumber(o.attackBonus),
        criticalRange: parseString(o.criticalRange),
        damage: parseString(o.damage),
      };
    case "ranged":
      if (!validateRanged(o)) return null;
      return {
        type: "ranged",
        name: parseString(o.name),
        attackBonus: parseNumber(o.attackBonus),
        criticalRange: parseString(o.criticalRange),
        damage: parseString(o.damage),
        range: parseString(o.range),
      };
    case "spell":
      if (!validateSpell(o)) return null;
      const spellId =
        o.spellId !== undefined && o.spellId !== null
          ? String(o.spellId)
          : undefined;
      return {
        type: "spell",
        spellId: spellId && mongoose.Types.ObjectId.isValid(spellId) ? spellId : undefined,
        spellName: parseString(o.spellName),
        damage: parseString(o.damage),
        savingThrow: parseString(o.savingThrow),
      };
    case "special":
      if (!validateSpecial(o)) return null;
      return {
        type: "special",
        description: parseString(o.description),
      };
    default:
      return null;
  }
}

export function validateAndNormalizeActions(
  actions: unknown
): { error?: string; actions?: OpponentAction[] } {
  if (!Array.isArray(actions)) {
    return { error: "Actions must be an array" };
  }
  const normalized: OpponentAction[] = [];
  for (const a of actions) {
    const n = normalizeAction(a);
    if (!n) continue;
    if (n.type === "special" && (n.description === undefined || n.description === ""))
      continue;
    normalized.push(n);
  }
  if (normalized.length === 0) {
    return { error: "At least one action is required" };
  }
  return { actions: normalized };
}

export function normalizeActionsForEncounter(
  actions: unknown
): OpponentAction[] {
  if (!Array.isArray(actions)) return [];
  const out: OpponentAction[] = [];
  for (const a of actions) {
    const n = normalizeAction(a);
    if (n) out.push(n);
  }
  return out;
}

export function isLegacyActionsArray(actions: unknown): actions is string[] {
  return (
    Array.isArray(actions) &&
    actions.every((a) => typeof a === "string")
  );
}

export function isStructuredActionsArray(actions: unknown): boolean {
  if (!Array.isArray(actions)) return false;
  return actions.every(
    (a) =>
      a !== null &&
      typeof a === "object" &&
      typeof (a as Record<string, unknown>).type === "string"
  );
}

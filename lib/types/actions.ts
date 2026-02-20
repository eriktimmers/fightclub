export type ActionType = "melee" | "ranged" | "spell" | "special";

export type MeleeAction = {
  type: "melee";
  attackBonus?: number;
  criticalRange?: string;
  damage?: string;
};

export type RangedAction = {
  type: "ranged";
  attackBonus?: number;
  criticalRange?: string;
  damage?: string;
  range?: string;
};

export type SpellAction = {
  type: "spell";
  spellId?: string;
  spellName?: string;
  damage?: string;
  savingThrow?: string;
};

export type SpecialAction = {
  type: "special";
  description?: string;
};

export type OpponentAction =
  | MeleeAction
  | RangedAction
  | SpellAction
  | SpecialAction;

export const ACTION_TYPES: ActionType[] = [
  "melee",
  "ranged",
  "spell",
  "special",
];

export function formatActionLabel(action: OpponentAction | string): string {
  if (typeof action === "string") return action;
  switch (action.type) {
    case "melee": {
      const parts = ["Melee"];
      if (action.attackBonus != null) parts.push(`+${action.attackBonus}`);
      if (action.criticalRange) parts.push(`crit ${action.criticalRange}`);
      if (action.damage) parts.push(action.damage);
      return parts.join(" ");
    }
    case "ranged": {
      const parts = ["Ranged"];
      if (action.attackBonus != null) parts.push(`+${action.attackBonus}`);
      if (action.criticalRange) parts.push(`crit ${action.criticalRange}`);
      if (action.damage) parts.push(action.damage);
      if (action.range) parts.push(`range ${action.range}`);
      return parts.join(" ");
    }
    case "spell": {
      const name = action.spellName || (action.spellId ? "Spell" : "—");
      const parts = [name];
      if (action.damage) parts.push(action.damage);
      if (action.savingThrow) parts.push(action.savingThrow);
      return parts.join(", ");
    }
    case "special":
      return action.description ?? "—";
  }
}

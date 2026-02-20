import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Opponent from "@/lib/models/Opponent";
import { validateAndNormalizeActions } from "@/lib/actions";

const DEFAULT_ABILITY = 11;
const DEFAULT_SAVE = 0;

function parseAbility(value: unknown): number {
  const n = Number(value);
  return Number.isNaN(n) ? DEFAULT_ABILITY : n;
}

function parseSave(value: unknown): number {
  const n = Number(value);
  return Number.isNaN(n) ? DEFAULT_SAVE : n;
}

function validateOpponentBody(body: unknown): {
  name?: string;
  type?: string;
  alignment?: string;
  actions?: unknown[];
  hitPoints?: number;
  armorClass?: number;
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
  error?: string;
} {
  const o = body as Record<string, unknown>;
  const name = o?.name;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return { error: "Name is required" };
  }
  const type = o?.type;
  if (!type || typeof type !== "string" || type.trim() === "") {
    return { error: "Type is required" };
  }
  const alignment = o?.alignment;
  if (!alignment || typeof alignment !== "string" || alignment.trim() === "") {
    return { error: "Alignment is required" };
  }
  const actionsResult = validateAndNormalizeActions(o?.actions);
  if (actionsResult.error) {
    return { error: actionsResult.error };
  }
  const hitPoints = Number(o?.hitPoints);
  if (Number.isNaN(hitPoints) || hitPoints < 0) {
    return { error: "Hit points must be a non-negative number" };
  }
  const armorClass = Number(o?.armorClass);
  if (Number.isNaN(armorClass) || armorClass < 0 || armorClass > 30) {
    return { error: "Armor class must be a number between 0 and 30" };
  }
  const initiativeBonus =
    o?.initiativeBonus === undefined
      ? 0
      : Number(o.initiativeBonus);
  if (Number.isNaN(initiativeBonus)) {
    return { error: "Initiative bonus must be a number" };
  }
  return {
    name: name.trim(),
    type: type.trim(),
    alignment: alignment.trim(),
    actions: actionsResult.actions,
    hitPoints,
    armorClass,
    initiativeBonus,
    strength: parseAbility(o?.strength),
    dexterity: parseAbility(o?.dexterity),
    constitution: parseAbility(o?.constitution),
    intelligence: parseAbility(o?.intelligence),
    wisdom: parseAbility(o?.wisdom),
    charisma: parseAbility(o?.charisma),
    savingThrowDex: parseSave(o?.savingThrowDex),
    savingThrowCon: parseSave(o?.savingThrowCon),
    savingThrowWis: parseSave(o?.savingThrowWis),
  };
}

export async function GET() {
  try {
    await connectDB();
    const opponents = await Opponent.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(opponents);
  } catch (error) {
    console.error("GET /api/opponents:", error);
    return NextResponse.json(
      { error: "Failed to fetch opponents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const validated = validateOpponentBody(body);
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const opponent = await Opponent.create({
      name: validated.name,
      type: validated.type,
      alignment: validated.alignment,
      actions: validated.actions,
      hitPoints: validated.hitPoints,
      armorClass: validated.armorClass,
      initiativeBonus: validated.initiativeBonus,
      strength: validated.strength,
      dexterity: validated.dexterity,
      constitution: validated.constitution,
      intelligence: validated.intelligence,
      wisdom: validated.wisdom,
      charisma: validated.charisma,
      savingThrowDex: validated.savingThrowDex,
      savingThrowCon: validated.savingThrowCon,
      savingThrowWis: validated.savingThrowWis,
    });
    return NextResponse.json(opponent);
  } catch (error) {
    console.error("POST /api/opponents:", error);
    return NextResponse.json(
      { error: "Failed to create opponent" },
      { status: 500 }
    );
  }
}

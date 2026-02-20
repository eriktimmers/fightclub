import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Opponent from "@/lib/models/Opponent";

function validateOpponentBody(body: unknown): {
  name?: string;
  type?: string;
  alignment?: string;
  actions?: string[];
  hitPoints?: number;
  armorClass?: number;
  initiativeBonus?: number;
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
  const actions = o?.actions;
  if (!Array.isArray(actions)) {
    return { error: "Actions must be an array" };
  }
  const actionsStrings = actions.filter((a): a is string => typeof a === "string");
  if (actionsStrings.length === 0) {
    return { error: "At least one action is required" };
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
    actions: actionsStrings,
    hitPoints,
    armorClass,
    initiativeBonus,
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

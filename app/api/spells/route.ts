import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Spell from "@/lib/models/Spell";

const SPELL_TYPES = ["priest", "wizard"] as const;

function validateSpellBody(body: unknown): {
  type?: "priest" | "wizard";
  level?: number;
  name?: string;
  description?: string;
  error?: string;
} {
  const o = body as Record<string, unknown>;
  const type = o?.type;
  if (!type || typeof type !== "string" || !SPELL_TYPES.includes(type as "priest" | "wizard")) {
    return { error: "Type must be 'priest' or 'wizard'" };
  }
  const level = Number(o?.level);
  if (Number.isNaN(level) || level < 0 || level > 9) {
    return { error: "Level must be a number between 0 and 9" };
  }
  const name = o?.name;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return { error: "Name is required" };
  }
  const description = o?.description;
  if (description !== undefined && description !== null && typeof description !== "string") {
    return { error: "Description must be a string" };
  }
  return {
    type: type as "priest" | "wizard",
    level,
    name: name.trim(),
    description: typeof description === "string" ? description : "",
  };
}

export async function GET() {
  try {
    await connectDB();
    const spells = await Spell.find().sort({ type: 1, level: 1, name: 1 }).lean();
    return NextResponse.json(spells);
  } catch (error) {
    console.error("GET /api/spells:", error);
    return NextResponse.json(
      { error: "Failed to fetch spells" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const validated = validateSpellBody(body);
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const spell = await Spell.create({
      type: validated.type,
      level: validated.level,
      name: validated.name,
      description: validated.description ?? "",
    });
    return NextResponse.json(spell);
  } catch (error) {
    console.error("POST /api/spells:", error);
    return NextResponse.json(
      { error: "Failed to create spell" },
      { status: 500 }
    );
  }
}

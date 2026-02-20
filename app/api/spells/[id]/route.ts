import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Spell from "@/lib/models/Spell";
import mongoose from "mongoose";

const SPELL_TYPES = ["priest", "wizard"] as const;

function isValidId(id: string): boolean {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
}

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid spell id" }, { status: 400 });
    }
    await connectDB();
    const spell = await Spell.findById(id).lean();
    if (!spell) {
      return NextResponse.json({ error: "Spell not found" }, { status: 404 });
    }
    return NextResponse.json(spell);
  } catch (error) {
    console.error("GET /api/spells/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch spell" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid spell id" }, { status: 400 });
    }
    await connectDB();
    const body = await request.json();
    const validated = validateSpellBody(body);
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const spell = await Spell.findByIdAndUpdate(
      id,
      {
        type: validated.type,
        level: validated.level,
        name: validated.name,
        description: validated.description ?? "",
      },
      { new: true }
    ).lean();
    if (!spell) {
      return NextResponse.json({ error: "Spell not found" }, { status: 404 });
    }
    return NextResponse.json(spell);
  } catch (error) {
    console.error("PATCH /api/spells/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update spell" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid spell id" }, { status: 400 });
    }
    await connectDB();
    const spell = await Spell.findByIdAndDelete(id);
    if (!spell) {
      return NextResponse.json({ error: "Spell not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/spells/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete spell" },
      { status: 500 }
    );
  }
}

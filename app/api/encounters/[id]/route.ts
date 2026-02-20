import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Encounter from "@/lib/models/Encounter";
import mongoose from "mongoose";

function isValidId(id: string): boolean {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
}

function validateOpponentSnapshot(o: unknown): o is {
  _id: string;
  name: string;
  type: string;
  alignment: string;
  actions: string[];
  hitPoints: number;
  armorClass: number;
  initiativeBonus: number;
} {
  const x = o as Record<string, unknown>;
  return (
    !!x &&
    typeof x._id === "string" &&
    typeof x.name === "string" &&
    typeof x.type === "string" &&
    typeof x.alignment === "string" &&
    Array.isArray(x.actions) &&
    (x.actions as unknown[]).every((a) => typeof a === "string") &&
    typeof x.hitPoints === "number" &&
    typeof x.armorClass === "number" &&
    (x.initiativeBonus === undefined ||
      (typeof x.initiativeBonus === "number" && !Number.isNaN(x.initiativeBonus)))
  );
}

function validateBody(body: unknown): {
  name?: string;
  opponents?: unknown[];
  error?: string;
} {
  const b = body as Record<string, unknown>;
  const name = b?.name;
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return { error: "Name must be a non-empty string" };
    }
  }
  const opponents = b?.opponents;
  if (opponents !== undefined) {
    if (!Array.isArray(opponents)) {
      return { error: "Opponents must be an array" };
    }
  }
  return {
    name: typeof name === "string" ? name.trim() : undefined,
    opponents:
      Array.isArray(opponents) ? opponents.filter(validateOpponentSnapshot) : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid encounter id" },
        { status: 400 }
      );
    }
    await connectDB();
    const encounter = await Encounter.findById(id).lean();
    if (!encounter) {
      return NextResponse.json(
        { error: "Encounter not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(encounter);
  } catch (error) {
    console.error("GET /api/encounters/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch encounter" },
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
      return NextResponse.json(
        { error: "Invalid encounter id" },
        { status: 400 }
      );
    }
    await connectDB();
    const body = await request.json();
    const validated = validateBody(body);
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const update: { name?: string; opponents?: unknown[] } = {};
    if (validated.name !== undefined) update.name = validated.name;
    if (validated.opponents !== undefined) update.opponents = validated.opponents;

    const encounter = await Encounter.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();
    if (!encounter) {
      return NextResponse.json(
        { error: "Encounter not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(encounter);
  } catch (error) {
    console.error("PATCH /api/encounters/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update encounter" },
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
      return NextResponse.json(
        { error: "Invalid encounter id" },
        { status: 400 }
      );
    }
    await connectDB();
    const encounter = await Encounter.findByIdAndDelete(id);
    if (!encounter) {
      return NextResponse.json(
        { error: "Encounter not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/encounters/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete encounter" },
      { status: 500 }
    );
  }
}

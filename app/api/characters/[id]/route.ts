import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Character from "@/lib/models/Character";
import mongoose from "mongoose";

function isValidId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid character id" }, { status: 400 });
    }
    await connectDB();
    const body = await request.json();
    const { name, armorClass } = body;

    const update: { name?: string; armorClass?: number } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      update.name = name.trim();
    }
    if (armorClass !== undefined) {
      const ac = Number(armorClass);
      if (Number.isNaN(ac) || ac < 0 || ac > 30) {
        return NextResponse.json(
          { error: "Armor class must be a number between 0 and 30" },
          { status: 400 }
        );
      }
      update.armorClass = ac;
    }

    const character = await Character.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    return NextResponse.json(character);
  } catch (error) {
    console.error("PATCH /api/characters/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
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
      return NextResponse.json({ error: "Invalid character id" }, { status: 400 });
    }
    await connectDB();
    const character = await Character.findByIdAndDelete(id);
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/characters/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete character" },
      { status: 500 }
    );
  }
}

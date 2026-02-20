import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Opponent from "@/lib/models/Opponent";
import { validateAndNormalizeActions } from "@/lib/actions";
import mongoose from "mongoose";

function isValidId(id: string): boolean {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid opponent id" },
        { status: 400 }
      );
    }
    await connectDB();
    const opponent = await Opponent.findById(id).lean();
    if (!opponent) {
      return NextResponse.json(
        { error: "Opponent not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(opponent);
  } catch (error) {
    console.error("GET /api/opponents/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch opponent" },
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
        { error: "Invalid opponent id" },
        { status: 400 }
      );
    }
    await connectDB();
    const body = await request.json();
    const update: {
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
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      update.name = body.name.trim();
    }
    if (body.type !== undefined) {
      if (typeof body.type !== "string" || body.type.trim() === "") {
        return NextResponse.json(
          { error: "Type must be a non-empty string" },
          { status: 400 }
        );
      }
      update.type = body.type.trim();
    }
    if (body.alignment !== undefined) {
      if (typeof body.alignment !== "string" || body.alignment.trim() === "") {
        return NextResponse.json(
          { error: "Alignment must be a non-empty string" },
          { status: 400 }
        );
      }
      update.alignment = body.alignment.trim();
    }
    if (body.actions !== undefined) {
      const result = validateAndNormalizeActions(body.actions);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      update.actions = result.actions;
    }
    if (body.hitPoints !== undefined) {
      const hp = Number(body.hitPoints);
      if (Number.isNaN(hp) || hp < 0) {
        return NextResponse.json(
          { error: "Hit points must be a non-negative number" },
          { status: 400 }
        );
      }
      update.hitPoints = hp;
    }
    if (body.armorClass !== undefined) {
      const ac = Number(body.armorClass);
      if (Number.isNaN(ac) || ac < 0 || ac > 30) {
        return NextResponse.json(
          { error: "Armor class must be a number between 0 and 30" },
          { status: 400 }
        );
      }
      update.armorClass = ac;
    }
    if (body.initiativeBonus !== undefined) {
      const ib = Number(body.initiativeBonus);
      if (Number.isNaN(ib)) {
        return NextResponse.json(
          { error: "Initiative bonus must be a number" },
          { status: 400 }
        );
      }
      update.initiativeBonus = ib;
    }
    const abilityKeys = [
      "strength",
      "dexterity",
      "constitution",
      "intelligence",
      "wisdom",
      "charisma",
    ] as const;
    for (const key of abilityKeys) {
      if (body[key] !== undefined) {
        const n = Number(body[key]);
        if (Number.isNaN(n) || n < 1 || n > 30) {
          return NextResponse.json(
            { error: `${key} must be a number between 1 and 30` },
            { status: 400 }
          );
        }
        update[key] = n;
      }
    }
    const saveKeys = [
      "savingThrowDex",
      "savingThrowCon",
      "savingThrowWis",
    ] as const;
    for (const key of saveKeys) {
      if (body[key] !== undefined) {
        const n = Number(body[key]);
        if (Number.isNaN(n)) {
          return NextResponse.json(
            { error: `${key} must be a number` },
            { status: 400 }
          );
        }
        update[key] = n;
      }
    }

    const opponent = await Opponent.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();
    if (!opponent) {
      return NextResponse.json(
        { error: "Opponent not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(opponent);
  } catch (error) {
    console.error("PATCH /api/opponents/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update opponent" },
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
        { error: "Invalid opponent id" },
        { status: 400 }
      );
    }
    await connectDB();
    const opponent = await Opponent.findByIdAndDelete(id);
    if (!opponent) {
      return NextResponse.json(
        { error: "Opponent not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/opponents/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete opponent" },
      { status: 500 }
    );
  }
}

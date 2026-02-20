import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Opponent from "@/lib/models/Opponent";
import mongoose from "mongoose";

function isValidId(id: string): boolean {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
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
      actions?: string[];
      hitPoints?: number;
      armorClass?: number;
      initiativeBonus?: number;
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
      if (!Array.isArray(body.actions)) {
        return NextResponse.json(
          { error: "Actions must be an array" },
          { status: 400 }
        );
      }
      const actionsStrings = body.actions.filter(
        (a: unknown): a is string => typeof a === "string"
      );
      if (actionsStrings.length === 0) {
        return NextResponse.json(
          { error: "At least one action is required" },
          { status: 400 }
        );
      }
      update.actions = actionsStrings;
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

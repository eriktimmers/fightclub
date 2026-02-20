import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Character from "@/lib/models/Character";

export async function GET() {
  try {
    await connectDB();
    const characters = await Character.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(characters);
  } catch (error) {
    console.error("GET /api/characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, armorClass } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    const ac = Number(armorClass);
    if (Number.isNaN(ac) || ac < 0 || ac > 30) {
      return NextResponse.json(
        { error: "Armor class must be a number between 0 and 30" },
        { status: 400 }
      );
    }

    const character = await Character.create({ name: name.trim(), armorClass: ac });
    return NextResponse.json(character);
  } catch (error) {
    console.error("POST /api/characters:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
}

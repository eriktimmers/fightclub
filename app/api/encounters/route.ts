import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Encounter from "@/lib/models/Encounter";

const ICAO_ALPHABET = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel",
  "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa",
  "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-ray",
  "Yankee", "Zulu",
];

type OpponentSnapshot = {
  _id: string;
  name: string;
  type: string;
  alignment: string;
  actions: string[];
  hitPoints: number;
  armorClass: number;
  initiativeBonus: number;
};

function applyDuplicateNicknames(opponents: OpponentSnapshot[]): OpponentSnapshot[] {
  const nameIndices = new Map<string, number>();
  return opponents.map((opp) => {
    const baseName = opp.name;
    const count = opponents.filter((o) => o.name === baseName).length;
    if (count <= 1) return { ...opp };
    const idx = nameIndices.get(baseName) ?? 0;
    nameIndices.set(baseName, idx + 1);
    const nickname = ICAO_ALPHABET[idx % ICAO_ALPHABET.length];
    return { ...opp, name: `${baseName} (${nickname})` };
  });
}

function validateOpponentSnapshot(o: unknown): o is OpponentSnapshot {
  const x = o as Record<string, unknown>;
  return (
    x &&
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

function validateBody(
  body: unknown
): { name: string; opponents: OpponentSnapshot[]; error?: string } {
  const b = body as Record<string, unknown>;
  const name = b?.name;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return { name: "", opponents: [], error: "Name is required" };
  }
  const opponents = b?.opponents;
  if (!Array.isArray(opponents)) {
    return { name: "", opponents: [], error: "Opponents must be an array" };
  }
  const valid = opponents.filter(validateOpponentSnapshot);
  return { name: name.trim(), opponents: valid };
}

export async function GET() {
  try {
    await connectDB();
    const encounters = await Encounter.find()
      .sort({ updatedAt: -1 })
      .lean();
    return NextResponse.json(encounters);
  } catch (error) {
    console.error("GET /api/encounters:", error);
    return NextResponse.json(
      { error: "Failed to fetch encounters" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const validated = validateBody(body);
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const opponentsWithNicknames = applyDuplicateNicknames(validated.opponents);
    const encounter = await Encounter.create({
      name: validated.name,
      opponents: opponentsWithNicknames,
    });
    return NextResponse.json(encounter);
  } catch (error) {
    console.error("POST /api/encounters:", error);
    return NextResponse.json(
      { error: "Failed to create encounter" },
      { status: 500 }
    );
  }
}

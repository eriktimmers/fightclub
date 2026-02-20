import mongoose from "mongoose";

const opponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    alignment: { type: String, required: true },
    actions: { type: [String], required: true, default: [] },
    hitPoints: { type: Number, required: true },
    armorClass: { type: Number, required: true },
    initiativeBonus: { type: Number, default: 0 },
    strength: { type: Number, default: 11 },
    dexterity: { type: Number, default: 11 },
    constitution: { type: Number, default: 11 },
    intelligence: { type: Number, default: 11 },
    wisdom: { type: Number, default: 11 },
    charisma: { type: Number, default: 11 },
    savingThrowDex: { type: Number, default: 0 },
    savingThrowCon: { type: Number, default: 0 },
    savingThrowWis: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Opponent =
  mongoose.models.Opponent ?? mongoose.model("Opponent", opponentSchema);

export default Opponent;

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
  },
  { timestamps: true }
);

const Opponent =
  mongoose.models.Opponent ?? mongoose.model("Opponent", opponentSchema);

export default Opponent;

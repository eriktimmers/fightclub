import mongoose from "mongoose";

const spellSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["priest", "wizard"] },
    level: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

const Spell =
  mongoose.models.Spell ?? mongoose.model("Spell", spellSchema);

export default Spell;

import mongoose from "mongoose";

const snapshotActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["melee", "ranged", "spell", "special"],
    },
    name: String,
    attackBonus: Number,
    criticalRange: String,
    damage: String,
    range: String,
    spellId: String,
    spellName: String,
    savingThrow: String,
    description: String,
  },
  { _id: false }
);

const opponentSnapshotSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    alignment: { type: String, required: true },
    actions: { type: [snapshotActionSchema], required: true, default: [] },
    hitPoints: { type: Number, required: true },
    armorClass: { type: Number, required: true },
    initiativeBonus: { type: Number, default: 0 },
  },
  { _id: false }
);

const encounterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    opponents: { type: [opponentSnapshotSchema], required: true, default: [] },
  },
  { timestamps: true }
);

const Encounter =
  mongoose.models.Encounter ?? mongoose.model("Encounter", encounterSchema);

export default Encounter;

import mongoose from "mongoose";

const characterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    armorClass: { type: Number, required: true },
  },
  { timestamps: true }
);

// Prevent model recompilation in development (Next.js hot reload)
const Character =
  mongoose.models.Character ?? mongoose.model("Character", characterSchema);

export default Character;

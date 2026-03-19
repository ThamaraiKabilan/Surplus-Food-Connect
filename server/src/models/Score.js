import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ["provider", "ngo"],
      required: true
    },
    trustScore: {
      type: Number,
      default: 0
    },
    totalContributions: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Score = mongoose.model("Score", scoreSchema);

export default Score;

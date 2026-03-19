import mongoose from "mongoose";

const proofSchema = new mongoose.Schema(
  {
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: ""
    },
    geoTagLocation: {
      type: String,
      default: ""
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    geoTagMatched: {
      type: Boolean,
      default: false
    },
    submittedWithinDeadline: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending"
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Proof = mongoose.model("Proof", proofSchema);

export default Proof;

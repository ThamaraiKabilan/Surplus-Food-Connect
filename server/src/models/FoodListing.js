import mongoose from "mongoose";

const foodListingSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    foodName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    fullAddress: {
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
    expiryTime: {
      type: Date,
      required: true
    },
    sourceType: {
      type: String,
      enum: ["home", "event"],
      default: "home"
    },
    homeTermsAccepted: {
      type: Boolean,
      default: false
    },
    eventProofMode: {
      type: String,
      enum: ["uploaded", "existing", ""],
      default: ""
    },
    eventProofLabel: {
      type: String,
      default: ""
    },
    eventProofFileUrl: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["available", "claimed"],
      default: "available"
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

const FoodListing = mongoose.model("FoodListing", foodListingSchema);

export default FoodListing;

import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["provider", "ngo"],
      required: true
    },
    documents: [
      {
        label: {
          type: String,
          required: true
        },
        fileUrl: {
          type: String,
          required: true
        },
        isDemo: {
          type: Boolean,
          default: false
        }
      }
    ],
    locationSnapshot: {
      location: {
        type: String,
        default: ""
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
      }
    },
    addressProofText: {
      type: String,
      default: ""
    },
    expiryTime: {
      type: Date,
      default: null
    },
    selfDeclarationAccepted: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },
    adminNotes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Verification = mongoose.model("Verification", verificationSchema);

export default Verification;

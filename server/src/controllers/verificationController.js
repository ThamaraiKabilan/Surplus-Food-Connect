import asyncHandler from "express-async-handler";
import Verification from "../models/Verification.js";
import User from "../models/User.js";
import { recalculateUserScore } from "../utils/scoring.js";

const providerDocuments = [
  { field: "foodSafetyCertificate", label: "Food Safety Certificate" },
  { field: "businessProof", label: "Business Proof" },
  { field: "foodPreparationProof", label: "Food Preparation Proof" }
];

const ngoDocuments = [
  { field: "ngoRegistrationCertificate", label: "NGO Registration Certificate" },
  { field: "idProof", label: "ID Proof" }
];

const buildDocuments = (filesByField = {}, role) => {
  const config = role === "provider" ? providerDocuments : ngoDocuments;

  return config
    .filter((item) => filesByField[item.field]?.[0])
    .map((item) => ({
      label: item.label,
      fileUrl: `/uploads/verifications/${filesByField[item.field][0].filename}`
    }));
};

const mergeDocuments = (existingDocuments = [], incomingDocuments = []) => {
  const merged = new Map(existingDocuments.map((item) => [item.label, item]));

  incomingDocuments.forEach((item) => {
    merged.set(item.label, item);
  });

  return Array.from(merged.values());
};

export const uploadVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const existingVerification = await Verification.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  const documents = mergeDocuments(
    existingVerification?.documents || [],
    buildDocuments(req.files || {}, req.user.role)
  );

  if (!documents.length) {
    return res.status(400).json({ message: "Please upload the required documents" });
  }

  if (req.user.role === "provider") {
    if (!req.body.expiryTime) {
      return res.status(400).json({ message: "Expiry time is required for providers" });
    }

    if (req.body.selfDeclarationAccepted !== "true") {
      return res.status(400).json({ message: "Self declaration must be accepted" });
    }
  }

  const verification = await Verification.findOneAndUpdate(
    { user: req.user._id },
    {
      user: req.user._id,
      role: req.user.role,
      documents,
      locationSnapshot: {
        location: user.location,
        fullAddress: user.fullAddress,
        latitude: user.latitude,
        longitude: user.longitude
      },
      addressProofText: req.user.role === "ngo" ? user.fullAddress || user.location : "",
      expiryTime: req.user.role === "provider" ? req.body.expiryTime : null,
      selfDeclarationAccepted:
        req.user.role === "provider" ? req.body.selfDeclarationAccepted === "true" : false,
      status: "pending",
      adminNotes: ""
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  return res.status(201).json(verification);
});

export const getMyVerification = asyncHandler(async (req, res) => {
  const verification = await Verification.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(verification);
});

export const getAllVerifications = asyncHandler(async (req, res) => {
  const verifications = await Verification.find({})
    .populate("user", "name email role location fullAddress")
    .sort({ createdAt: -1 });

  return res.json(verifications);
});

export const updateVerificationStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const verification = await Verification.findById(req.params.id);

  if (!verification) {
    return res.status(404).json({ message: "Verification request not found" });
  }

  verification.status = status;
  verification.adminNotes = adminNotes || "";
  await verification.save();

  const user = await User.findById(verification.user);
  await recalculateUserScore(user);

  return res.json(verification);
});

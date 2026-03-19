import asyncHandler from "express-async-handler";
import Claim from "../models/Claim.js";
import Proof from "../models/Proof.js";
import { isLocationMatch } from "../utils/distance.js";
import { recalculateUserScore } from "../utils/scoring.js";

const PROOF_DEADLINE_HOURS = 24;

export const uploadProof = asyncHandler(async (req, res) => {
  const { claimId, notes, geoTagLocation, latitude, longitude, timestamp } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Please upload a proof image" });
  }

  const claim = await Claim.findById(claimId).populate("foodId");
  if (!claim) {
    return res.status(404).json({ message: "Claim not found" });
  }

  if (String(claim.ngo) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only upload proof for your own claims" });
  }

  const existingProof = await Proof.findOne({ claim: claimId });
  if (existingProof) {
    return res.status(400).json({ message: "Proof already uploaded for this claim" });
  }

  const matched = isLocationMatch(geoTagLocation, claim.foodId?.location || "");
  const proofTimestamp = timestamp || Date.now();
  const deadline = new Date(new Date(claim.timestamp).getTime() + PROOF_DEADLINE_HOURS * 60 * 60 * 1000);
  const withinDeadline = new Date(proofTimestamp) <= deadline;

  const proof = await Proof.create({
    claim: claimId,
    ngo: req.user._id,
    provider: claim.provider,
    imageUrl: `/uploads/proofs/${req.file.filename}`,
    notes,
    geoTagLocation,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    timestamp: proofTimestamp,
    geoTagMatched: matched,
    submittedWithinDeadline: withinDeadline,
    status: "pending"
  });

  claim.proofSubmitted = true;
  await claim.save();

  await recalculateUserScore(req.user);

  const populatedProof = await proof.populate([
    { path: "ngo", select: "name location" },
    { path: "provider", select: "name location" },
    {
      path: "claim",
      populate: { path: "foodId", select: "foodName location quantity" }
    }
  ]);

  return res.status(201).json(populatedProof);
});

export const reviewProof = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["approved", "denied"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or denied" });
  }

  const proof = await Proof.findById(req.params.id).populate("claim");

  if (!proof) {
    return res.status(404).json({ message: "Proof not found" });
  }

  if (String(proof.provider) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only review proof for your own claimed food" });
  }

  proof.status = status;
  proof.reviewedAt = new Date();
  await proof.save();

  await recalculateUserScore({ _id: proof.ngo, role: "ngo" });

  const populatedProof = await proof.populate([
    { path: "ngo", select: "name location" },
    { path: "provider", select: "name location" },
    {
      path: "claim",
      populate: { path: "foodId", select: "foodName location quantity" }
    }
  ]);

  return res.json(populatedProof);
});

export const getProofs = asyncHandler(async (req, res) => {
  const query =
    req.user.role === "ngo"
      ? { ngo: req.user._id }
      : req.user.role === "provider"
        ? { provider: req.user._id }
        : {};

  const proofs = await Proof.find(query)
    .populate("ngo", "name location")
    .populate("provider", "name location")
    .populate({
      path: "claim",
      populate: { path: "foodId", select: "foodName location quantity" }
    })
    .sort({ createdAt: -1 });

  return res.json(proofs);
});

import asyncHandler from "express-async-handler";
import Claim from "../models/Claim.js";
import FoodListing from "../models/FoodListing.js";
import Proof from "../models/Proof.js";
import User from "../models/User.js";
import { recalculateUserScore } from "../utils/scoring.js";

export const createClaim = asyncHandler(async (req, res) => {
  const { foodId } = req.body;

  if (!foodId) {
    return res.status(400).json({ message: "foodId is required" });
  }

  const listing = await FoodListing.findById(foodId);
  if (!listing) {
    return res.status(404).json({ message: "Food listing not found" });
  }

  const existingClaim = await Claim.findOne({ foodId });
  if (existingClaim || listing.status === "claimed") {
    return res.status(400).json({ message: "Food has already been claimed" });
  }

  listing.status = "claimed";
  listing.claimedBy = req.user._id;
  await listing.save();

  const claim = await Claim.create({
    foodId,
    ngo: req.user._id,
    provider: listing.provider
  });

  const provider = await User.findById(listing.provider);
  await recalculateUserScore(provider);

  const populatedClaim = await claim.populate([
    { path: "ngo", select: "name email location" },
    { path: "provider", select: "name email location" },
    {
      path: "foodId",
      populate: [
        { path: "provider", select: "name email location" },
        { path: "claimedBy", select: "name email location" }
      ]
    }
  ]);

  return res.status(201).json(populatedClaim);
});

export const getClaims = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === "ngo") {
    query.ngo = req.user._id;
  }

  if (req.user.role === "provider") {
    query.provider = req.user._id;
  }

  const claims = await Claim.find(query)
    .populate("ngo", "name email location")
    .populate("provider", "name email location")
    .populate({
      path: "foodId",
      populate: [
        { path: "provider", select: "name email location" },
        { path: "claimedBy", select: "name email location" }
      ]
    })
    .sort({ createdAt: -1 });

  if (req.user.role === "provider") {
    const claimIds = claims.map((claim) => claim._id);
    const proofs = await Proof.find({ claim: { $in: claimIds } });
    const proofMap = new Map(proofs.map((proof) => [String(proof.claim), proof]));

    return res.json(
      claims.map((claim) => ({
        ...claim.toObject(),
        proof: proofMap.get(String(claim._id)) || null
      }))
    );
  }

  return res.json(claims);
});

export const getMyClaims = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ ngo: req.user._id })
    .populate("provider", "name email location")
    .populate({
      path: "foodId",
      populate: { path: "provider", select: "name email location" }
    })
    .sort({ createdAt: -1 });

  const claimIds = claims.map((claim) => claim._id);
  const proofs = await Proof.find({ claim: { $in: claimIds } });
  const proofMap = new Map(proofs.map((proof) => [String(proof.claim), proof]));

  return res.json(
    claims.map((claim) => ({
      ...claim.toObject(),
      proof: proofMap.get(String(claim._id)) || null
    }))
  );
});

import asyncHandler from "express-async-handler";
import Claim from "../models/Claim.js";
import Complaint from "../models/Complaint.js";

export const createComplaint = asyncHandler(async (req, res) => {
  const { claimId, providerId, description } = req.body;

  if (!description) {
    return res.status(400).json({ message: "Complaint description is required" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Complaint image proof is required" });
  }

  let provider = providerId;

  if (claimId) {
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    provider = claim.provider;
  }

  const complaint = await Complaint.create({
    claim: claimId || null,
    ngo: req.user._id,
    provider,
    description,
    imageUrl: `/uploads/complaints/${req.file.filename}`
  });

  const populatedComplaint = await complaint.populate([
    { path: "ngo", select: "name location" },
    { path: "provider", select: "name location" },
    {
      path: "claim",
      populate: { path: "foodId", select: "foodName location quantity" }
    }
  ]);

  return res.status(201).json(populatedComplaint);
});

export const getComplaints = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" ? {} : { ngo: req.user._id };

  const complaints = await Complaint.find(query)
    .populate("ngo", "name location")
    .populate("provider", "name location")
    .populate({
      path: "claim",
      populate: { path: "foodId", select: "foodName location quantity" }
    })
    .sort({ createdAt: -1 });

  return res.json(complaints);
});

export const resolveComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  complaint.status = "resolved";
  await complaint.save();

  return res.json(complaint);
});

import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import FoodListing from "../models/FoodListing.js";
import Complaint from "../models/Complaint.js";
import Score from "../models/Score.js";
import Verification from "../models/Verification.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  return res.json(users);
});

export const getAllFoodListings = asyncHandler(async (req, res) => {
  const listings = await FoodListing.find({})
    .populate("provider", "name email location")
    .populate("claimedBy", "name email location")
    .sort({ createdAt: -1 });

  return res.json(listings);
});

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [users, verifications, complaints, scores] = await Promise.all([
    User.countDocuments({}),
    Verification.countDocuments({ status: "pending" }),
    Complaint.countDocuments({ status: "open" }),
    Score.find({}).sort({ trustScore: -1 }).limit(5).populate("user", "name role")
  ]);

  return res.json({
    users,
    pendingVerifications: verifications,
    openComplaints: complaints,
    topTrust: scores
  });
});

import asyncHandler from "express-async-handler";
import Score from "../models/Score.js";

export const getLeaderboard = asyncHandler(async (req, res) => {
  const role =
    req.user.role === "provider"
      ? "ngo"
      : req.user.role === "ngo"
        ? "provider"
        : req.query.role === "provider"
          ? "provider"
          : "ngo";

  const leaderboard = await Score.find({ role })
    .populate("user", "name location fullAddress")
    .sort({ trustScore: -1, totalContributions: -1, updatedAt: -1 });

  return res.json(
    leaderboard.map((item, index) => ({
      ...item.toObject(),
      rank: index + 1
    }))
  );
});

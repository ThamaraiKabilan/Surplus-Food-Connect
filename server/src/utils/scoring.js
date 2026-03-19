import Claim from "../models/Claim.js";
import Proof from "../models/Proof.js";
import Score from "../models/Score.js";
import Verification from "../models/Verification.js";

export const recalculateUserScore = async (user) => {
  if (!user || user.role === "admin") {
    return null;
  }

  let trustScore = 0;
  let totalContributions = 0;

  if (user.role === "ngo") {
    const proofs = await Proof.find({ ngo: user._id });
    const approvedProofs = proofs.filter((proof) => proof.status === "approved");
    totalContributions = approvedProofs.length;
    trustScore += approvedProofs.length * 10;
    trustScore += approvedProofs.filter((proof) => proof.geoTagMatched).length * 5;
    trustScore += approvedProofs.filter((proof) => proof.submittedWithinDeadline).length * 5;
  }

  if (user.role === "provider") {
    const successfulDeliveries = await Claim.countDocuments({ provider: user._id });
    const verification = await Verification.findOne({
      user: user._id,
      status: "verified"
    }).sort({ createdAt: -1 });

    totalContributions = successfulDeliveries;
    trustScore += successfulDeliveries * 10;

    if (verification) {
      trustScore += 5;
    }
  }

  return Score.findOneAndUpdate(
    { user: user._id },
    {
      user: user._id,
      role: user.role,
      trustScore,
      totalContributions
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

export const recalculateAllScores = async (users) => {
  for (const user of users) {
    await recalculateUserScore(user);
  }
};

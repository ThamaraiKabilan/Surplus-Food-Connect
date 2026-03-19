import asyncHandler from "express-async-handler";
import FoodListing from "../models/FoodListing.js";
import Score from "../models/Score.js";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import {
  buildGoogleMapsLink,
  getCoordinateDistance,
  getDistanceScore,
  resolveCoordinates
} from "../utils/distance.js";

export const createFoodListing = asyncHandler(async (req, res) => {
  const {
    foodName,
    quantity,
    location,
    fullAddress,
    latitude,
    longitude,
    expiryTime,
    sourceType,
    homeTermsAccepted,
    eventProofMode
  } = req.body;

  if (!foodName || !quantity || !location || !expiryTime) {
    return res.status(400).json({ message: "Please fill all food fields" });
  }

  const normalizedSourceType = sourceType === "event" ? "event" : "home";
  let normalizedEventProofMode = "";
  let proofLabel = "";
  let proofFileUrl = "";

  if (normalizedSourceType === "home") {
    if (homeTermsAccepted !== "true") {
      return res.status(400).json({ message: "Please accept the home food responsibility terms" });
    }
  } else {
    const providerVerification = await Verification.findOne({
      user: req.user._id,
      role: "provider"
    }).sort({ createdAt: -1 });

    if (!providerVerification?.documents?.length) {
      return res.status(400).json({ message: "Please upload provider proof before posting hotel food" });
    }

    normalizedEventProofMode = eventProofMode === "uploaded" ? "uploaded" : "existing";

    if (normalizedEventProofMode === "uploaded") {
      const proofFile = req.files?.eventProof?.[0];

      if (!proofFile) {
        return res.status(400).json({ message: "Event or hotel proof is required" });
      }

      proofLabel = "Uploaded event or hotel proof";
      proofFileUrl = `/uploads/food-listings/${proofFile.filename}`;
    } else {
      const existingDocument = providerVerification.documents.find((item) =>
        item.label.toLowerCase().includes("business proof")
      ) || providerVerification.documents[0];

      proofLabel = existingDocument.label;
      proofFileUrl = existingDocument.isDemo ? "" : existingDocument.fileUrl;
    }
  }

  const listing = await FoodListing.create({
    provider: req.user._id,
    foodName,
    quantity,
    location,
    fullAddress: fullAddress || req.user.fullAddress,
    latitude: latitude ? Number(latitude) : req.user.latitude,
    longitude: longitude ? Number(longitude) : req.user.longitude,
    expiryTime,
    sourceType: normalizedSourceType,
    homeTermsAccepted: normalizedSourceType === "home",
    eventProofMode: normalizedEventProofMode,
    eventProofLabel: proofLabel,
    eventProofFileUrl: proofFileUrl
  });

  const populatedListing = await listing.populate("provider", "name email location");
  return res.status(201).json(populatedListing);
});

export const getFoodListings = asyncHandler(async (req, res) => {
  const { location, mine, status, latitude, longitude } = req.query;
  const query = {};

  if (mine === "true") {
    query.provider = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  if (req.user.role === "ngo") {
    query.status = "available";
  }

  const listings = await FoodListing.find(query)
    .populate("provider", "name email location")
    .populate("claimedBy", "name email location")
    .sort({ createdAt: -1 });

  const providerIds = listings.map((listing) => listing.provider?._id).filter(Boolean);
  const scores = await Score.find({ user: { $in: providerIds } });
  const scoreMap = new Map(scores.map((score) => [String(score.user), score]));
  const queryLatitude = latitude === undefined ? null : Number(latitude);
  const queryLongitude = longitude === undefined ? null : Number(longitude);
  const originCoordinates =
    queryLatitude !== null && queryLongitude !== null && !Number.isNaN(queryLatitude) && !Number.isNaN(queryLongitude)
      ? { latitude: queryLatitude, longitude: queryLongitude }
      : location
        ? resolveCoordinates(location)
        : { latitude: req.user.latitude, longitude: req.user.longitude };

  const transformed = listings.map((listing) => ({
    ...listing.toObject(),
    providerTrustScore: scoreMap.get(String(listing.provider?._id))?.trustScore || 0,
    distanceScore:
      location && originCoordinates.latitude == null
        ? getDistanceScore(location, listing.location)
        : getCoordinateDistance(
            originCoordinates,
            { latitude: listing.latitude, longitude: listing.longitude }
          ),
    mapsUrl: buildGoogleMapsLink({
      latitude: listing.latitude,
      longitude: listing.longitude,
      query: listing.fullAddress || listing.location
    })
  }));

  transformed.sort((a, b) => {
    if ((a.distanceScore || 0) === (b.distanceScore || 0)) {
      return (b.providerTrustScore || 0) - (a.providerTrustScore || 0);
    }

    return (a.distanceScore || 0) - (b.distanceScore || 0);
  });

  return res.json(transformed);
});

export const markFoodClaimed = asyncHandler(async (req, res) => {
  const listing = await FoodListing.findById(req.params.id);

  if (!listing) {
    return res.status(404).json({ message: "Food listing not found" });
  }

  if (String(listing.provider) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only update your own listings" });
  }

  listing.status = "claimed";
  await listing.save();

  const populatedListing = await listing.populate([
    { path: "provider", select: "name email location" },
    { path: "claimedBy", select: "name email location" }
  ]);

  return res.json(populatedListing);
});

export const getNearbyNGOsForProvider = asyncHandler(async (req, res) => {
  const ngos = await User.find({ role: "ngo" }).select("-password");
  const scores = await Score.find({ role: "ngo" });
  const scoreMap = new Map(scores.map((score) => [String(score.user), score]));

  const suggestions = ngos
    .map((ngo) => ({
      _id: ngo._id,
      name: ngo.name,
      location: ngo.location,
      fullAddress: ngo.fullAddress,
      latitude: ngo.latitude,
      longitude: ngo.longitude,
      trustScore: scoreMap.get(String(ngo._id))?.trustScore || 0,
      totalContributions: scoreMap.get(String(ngo._id))?.totalContributions || 0,
      distanceScore: getCoordinateDistance(
        { latitude: req.user.latitude, longitude: req.user.longitude },
        { latitude: ngo.latitude, longitude: ngo.longitude }
      ),
      mapsUrl: buildGoogleMapsLink({
        latitude: ngo.latitude,
        longitude: ngo.longitude,
        query: ngo.fullAddress || ngo.location
      })
    }))
    .sort((a, b) => {
      if (a.distanceScore === b.distanceScore) {
        return b.trustScore - a.trustScore;
      }

      return a.distanceScore - b.distanceScore;
    });

  return res.json(suggestions);
});

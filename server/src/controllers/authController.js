import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Score from "../models/Score.js";
import Verification from "../models/Verification.js";
import { generateToken } from "../utils/jwt.js";
import {
  buildGoogleMapsLink,
  getCoordinateDistance,
  resolveCoordinates
} from "../utils/distance.js";

const serializeAuth = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  location: user.location,
  fullAddress: user.fullAddress,
  latitude: user.latitude,
  longitude: user.longitude,
  token: generateToken(user._id)
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const normalizedRole = role === "ngo" ? "ngo" : "provider";
  const derivedName = (name || email.split("@")[0] || "user").trim();

  const user = await User.create({
    name: derivedName,
    email,
    password,
    role: normalizedRole
  });

  return res.status(201).json(serializeAuth(user));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  return res.json(serializeAuth(user));
});

export const getCurrentUser = asyncHandler(async (req, res) => res.json(req.user));

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, location, fullAddress, latitude, longitude } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const coordinates = resolveCoordinates(
    location ?? user.location,
    latitude === "" ? null : Number(latitude),
    longitude === "" ? null : Number(longitude)
  );

  user.name = name ?? user.name;
  user.location = location ?? user.location;
  user.fullAddress = fullAddress ?? user.fullAddress;
  user.latitude = coordinates.latitude;
  user.longitude = coordinates.longitude;

  await user.save();

  return res.json(serializeAuth(user));
});

export const getNearbyOrganizations = asyncHandler(async (req, res) => {
  const role = req.query.role === "provider" ? "provider" : "ngo";
  const users = await User.find({ role }).select("-password");
  const scores = await Score.find({ role });
  const verifications = await Verification.find({ status: "verified" });

  const scoreMap = new Map(scores.map((item) => [String(item.user), item]));
  const verificationSet = new Set(verifications.map((item) => String(item.user)));

  const nearby = users
    .filter((user) => String(user._id) !== String(req.user._id))
    .map((user) => {
      const score = scoreMap.get(String(user._id));
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        location: user.location,
        fullAddress: user.fullAddress,
        latitude: user.latitude,
        longitude: user.longitude,
        trustScore: score?.trustScore || 0,
        totalContributions: score?.totalContributions || 0,
        verificationStatus: verificationSet.has(String(user._id)) ? "verified" : "pending",
        distanceScore: getCoordinateDistance(
          { latitude: req.user.latitude, longitude: req.user.longitude },
          { latitude: user.latitude, longitude: user.longitude }
        ),
        mapsUrl: buildGoogleMapsLink({
          latitude: user.latitude,
          longitude: user.longitude,
          query: user.fullAddress || user.location
        })
      };
    })
    .sort((a, b) => {
      if (a.distanceScore === b.distanceScore) {
        return b.trustScore - a.trustScore;
      }

      return a.distanceScore - b.distanceScore;
    });

  return res.json(nearby);
});

export const getMapUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $in: ["provider", "ngo"] } }).select("-password");
  const scores = await Score.find({});
  const scoreMap = new Map(scores.map((item) => [String(item.user), item]));

  return res.json(
    users.map((user) => ({
      _id: user._id,
      name: user.name,
      role: user.role,
      location: user.location,
      fullAddress: user.fullAddress,
      latitude: user.latitude,
      longitude: user.longitude,
      trustScore: scoreMap.get(String(user._id))?.trustScore || 0,
      mapsUrl: buildGoogleMapsLink({
        latitude: user.latitude,
        longitude: user.longitude,
        query: user.fullAddress || user.location
      })
    }))
  );
});

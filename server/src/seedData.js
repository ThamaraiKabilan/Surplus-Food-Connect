import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import FoodListing from "./models/FoodListing.js";
import Claim from "./models/Claim.js";
import Complaint from "./models/Complaint.js";
import Proof from "./models/Proof.js";
import Score from "./models/Score.js";
import Verification from "./models/Verification.js";
import { recalculateAllScores } from "./utils/scoring.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  await Claim.deleteMany({});
  await FoodListing.deleteMany({});
  await Proof.deleteMany({});
  await Complaint.deleteMany({});
  await Verification.deleteMany({});
  await Score.deleteMany({});
  await User.deleteMany({});

  const users = await User.create([
    {
      name: "Fresh Feast Hostel",
      email: "provider@demo.com",
      password: "password123",
      role: "provider",
      location: "Pune",
      fullAddress: "Fresh Feast Hostel, FC Road, Pune",
      latitude: 18.5204,
      longitude: 73.8567
    },
    {
      name: "Helping Hands NGO",
      email: "ngo@demo.com",
      password: "password123",
      role: "ngo",
      location: "Pune",
      fullAddress: "Helping Hands NGO Center, Shivajinagar, Pune",
      latitude: 18.5314,
      longitude: 73.8446
    },
    {
      name: "Platform Admin",
      email: "admin@demo.com",
      password: "password123",
      role: "admin",
      location: "Mumbai",
      fullAddress: "Admin Office, Dadar, Mumbai",
      latitude: 19.076,
      longitude: 72.8777
    }
  ]);

  const provider = users.find((user) => user.role === "provider");
  const ngo = users.find((user) => user.role === "ngo");

  const listings = await FoodListing.create([
    {
      provider: provider._id,
      foodName: "Veg Biryani",
      quantity: "25 meal boxes",
      location: "Pune",
      fullAddress: "Fresh Feast Hostel, FC Road, Pune",
      latitude: 18.5204,
      longitude: 73.8567,
      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: "available"
    },
    {
      provider: provider._id,
      foodName: "Chapati and Dal",
      quantity: "18 plates",
      location: "Mumbai",
      fullAddress: "Fresh Feast Branch, Dadar, Mumbai",
      latitude: 19.076,
      longitude: 72.8777,
      expiryTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      status: "claimed",
      claimedBy: ngo._id
    },
    {
      provider: provider._id,
      foodName: "Fruit Packets",
      quantity: "30 packs",
      location: "Pune",
      fullAddress: "Fresh Feast Hostel, FC Road, Pune",
      latitude: 18.5204,
      longitude: 73.8567,
      expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: "available"
    }
  ]);

  const claim = await Claim.create({
    foodId: listings[1]._id,
    ngo: ngo._id,
    provider: provider._id
  });

  await Verification.create({
    user: provider._id,
    role: "provider",
    documents: [
      { label: "Food safety certificate", fileUrl: "/uploads/verifications/sample-provider-cert.pdf" },
      { label: "License", fileUrl: "/uploads/verifications/sample-provider-license.pdf" }
    ],
    status: "verified",
    adminNotes: "Verified for demo data"
  });

  await Verification.create({
    user: ngo._id,
    role: "ngo",
    documents: [
      { label: "Registration certificate", fileUrl: "/uploads/verifications/sample-ngo-registration.pdf" },
      { label: "ID proof", fileUrl: "/uploads/verifications/sample-ngo-id.pdf" }
    ],
    status: "pending"
  });

  await Proof.create({
    claim: claim._id,
    ngo: ngo._id,
    provider: provider._id,
    imageUrl: "/uploads/proofs/sample-proof.jpg",
    notes: "Distributed to 18 people.",
    geoTagLocation: "Mumbai",
    latitude: 19.076,
    longitude: 72.8777,
    geoTagMatched: true
  });

  claim.proofSubmitted = true;
  await claim.save();

  await Complaint.create({
    claim: claim._id,
    ngo: ngo._id,
    provider: provider._id,
    description: "Sample complaint for dashboard preview.",
    imageUrl: "/uploads/complaints/sample-complaint.jpg",
    status: "open"
  });

  await recalculateAllScores([provider, ngo]);

  console.log("Sample data seeded successfully");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seeding failed", error);
  process.exit(1);
});

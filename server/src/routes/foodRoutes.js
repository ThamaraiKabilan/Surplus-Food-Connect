import express from "express";
import {
  createFoodListing,
  getFoodListings,
  getNearbyNGOsForProvider,
  markFoodClaimed
} from "../controllers/foodController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";

const router = express.Router();
const foodUpload = createUploader("food-listings");

router
  .route("/")
  .get(protect, getFoodListings)
  .post(
    protect,
    authorize("provider"),
    foodUpload.fields([{ name: "eventProof", maxCount: 1 }]),
    createFoodListing
  );

router.get("/nearby-ngos", protect, authorize("provider"), getNearbyNGOsForProvider);
router.patch("/:id/claimed", protect, authorize("provider"), markFoodClaimed);

export default router;

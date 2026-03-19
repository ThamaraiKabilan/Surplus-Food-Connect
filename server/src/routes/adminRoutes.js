import express from "express";
import {
  getAdminOverview,
  getAllFoodListings,
  getAllUsers
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", protect, authorize("admin"), getAllUsers);
router.get("/food", protect, authorize("admin"), getAllFoodListings);
router.get("/overview", protect, authorize("admin"), getAdminOverview);

export default router;

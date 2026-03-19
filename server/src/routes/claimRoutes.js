import express from "express";
import {
  createClaim,
  getClaims,
  getMyClaims
} from "../controllers/claimController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getClaims);
router.get("/my-claims", protect, authorize("ngo"), getMyClaims);
router.post("/", protect, authorize("ngo"), createClaim);

export default router;

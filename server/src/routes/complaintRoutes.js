import express from "express";
import {
  createComplaint,
  getComplaints,
  resolveComplaint
} from "../controllers/complaintController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";

const router = express.Router();
const complaintUpload = createUploader("complaints");

router.get("/", protect, authorize("ngo", "admin"), getComplaints);
router.post("/", protect, authorize("ngo"), complaintUpload.single("image"), createComplaint);
router.patch("/:id/resolve", protect, authorize("admin"), resolveComplaint);

export default router;

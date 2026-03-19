import express from "express";
import {
  getAllVerifications,
  getMyVerification,
  updateVerificationStatus,
  uploadVerification
} from "../controllers/verificationController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";

const router = express.Router();
const verificationUpload = createUploader("verifications");
const verificationFields = [
  { name: "foodSafetyCertificate", maxCount: 1 },
  { name: "businessProof", maxCount: 1 },
  { name: "foodPreparationProof", maxCount: 1 },
  { name: "ngoRegistrationCertificate", maxCount: 1 },
  { name: "idProof", maxCount: 1 }
];

router.get("/mine", protect, authorize("provider", "ngo"), getMyVerification);
router.post(
  "/upload",
  protect,
  authorize("provider", "ngo"),
  verificationUpload.fields(verificationFields),
  uploadVerification
);
router.get("/", protect, authorize("admin"), getAllVerifications);
router.patch("/:id/status", protect, authorize("admin"), updateVerificationStatus);

export default router;

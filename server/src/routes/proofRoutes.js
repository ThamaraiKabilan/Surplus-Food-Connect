import express from "express";
import { getProofs, reviewProof, uploadProof } from "../controllers/proofController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";

const router = express.Router();
const proofUpload = createUploader("proofs");

router.get("/", protect, authorize("ngo", "provider", "admin"), getProofs);
router.post("/", protect, authorize("ngo"), proofUpload.single("image"), uploadProof);
router.patch("/:id/review", protect, authorize("provider"), reviewProof);

export default router;

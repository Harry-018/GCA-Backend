import express from "express";
import {
  createVerification,
  verifyOtp,
} from "../controllers/emailVerificationController.js";
const router = express.Router();

router.post("/send", createVerification);
router.post("/verify", verifyOtp);

export default router;

import express from "express";
import {
  createVerification,
  verifyOtp,
} from "../controllers/emailVerificationController.js";
const router = express.Router();

console.log("verificationRoutes loaded");

router.post("/", createVerification);
router.post("/verify", verifyOtp);

export default router;

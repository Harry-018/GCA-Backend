import express from "express";

import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from "../controllers/forgotPasswordController.js";

const router = express.Router();

router.post("/send-code", sendPasswordResetCode);
router.post("/verify-code", verifyPasswordResetCode);
router.post("/reset-password", resetPassword);

export default router;

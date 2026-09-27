import express from "express";
import {
  createRegistrationInvitation,
  verifyRegistrationInvitation,
  submitTeacherRegistration,
} from "../controllers/teacherRegistrationController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit", submitTeacherRegistration);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createRegistrationInvitation,
);

router.get("/verify/:token", verifyRegistrationInvitation);

export default router;

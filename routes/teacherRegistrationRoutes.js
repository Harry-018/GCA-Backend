import express from "express";
import {
  createRegistrationInvitation,
  verifyRegistrationInvitation,
  submitTeacherRegistration,
} from "../controllers/teacherRegistrationController.js";

const router = express.Router();

router.post("/", createRegistrationInvitation);
router.post("/submit", submitTeacherRegistration);
router.get("/verify/:token", verifyRegistrationInvitation);
export default router;

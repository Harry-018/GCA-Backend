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

//00374e6fb97dad85816344621d6bb0607eb0ca9e8ebb617f17535ce678b8fd0b

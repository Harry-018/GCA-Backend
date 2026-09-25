import express from "express";
import {
  createRegistrationInvitation,
  verifyRegistrationInvitation,
} from "../controllers/teacherRegistrationController.js";

const router = express.Router();

router.post("/", createRegistrationInvitation);

router.get("/verify/:token", verifyRegistrationInvitation);
export default router;

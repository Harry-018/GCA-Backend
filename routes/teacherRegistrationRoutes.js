import express from "express";
import { createRegistrationInvitation } from "../controllers/teacherRegistrationController.js";

const router = express.Router();

router.post("/", createRegistrationInvitation);

export default router;

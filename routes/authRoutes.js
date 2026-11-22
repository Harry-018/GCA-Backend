import express from "express";
import { authenticateUser } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", authenticateUser);

export default router;

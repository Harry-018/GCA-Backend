import express from "express";
import { authenticateUser } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", authenticateUser);

router.get("/test", authenticate, (req, res) => {
  req.json({ message: "you are authenticated", user: req.user });
});
export default router;

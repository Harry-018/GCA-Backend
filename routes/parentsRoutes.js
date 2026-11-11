import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import {
  getParents,
  getParentInfoByUserId,
  getParentDashboard,
} from "../controllers/parentsController.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getParents);
router.get("/me", authenticate, authorize("parent"), getParentInfoByUserId);

router.get(
  "/me/dashboard",
  authenticate,
  authorize("parent"),
  getParentDashboard,
);

export default router;

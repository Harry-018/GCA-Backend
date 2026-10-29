import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import {
  getParents,
  getParentInfoByUserId,
} from "../controllers/parentsController.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getParents);
router.get("/me", authenticate, authorize("parent"), getParentInfoByUserId);

export default router;

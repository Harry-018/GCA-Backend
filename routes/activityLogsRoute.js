import express from "express";
import {
  createAdminActivityLog,
  getAdminActivityLogs,
} from "../controllers/activityLogsController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getAdminActivityLogs);

router.post("/", authenticate, authorize("admin"), createAdminActivityLog);

export default router;

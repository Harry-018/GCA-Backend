import express from "express";

import { getTeachers } from "../controllers/teachersController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getTeachers);
export default router;

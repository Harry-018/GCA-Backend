import express from "express";

import {
  getTeachers,
  getTeacherInfo,
  updateTeacher,
} from "../controllers/teachersController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getTeachers);

router.get("/:teacher_id", authenticate, authorize("admin"), getTeacherInfo);

router.patch("/:teacher_id", authenticate, authorize("admin"), updateTeacher);

export default router;

import express from "express";

import {
  getTeachers,
  getTeacherInfo,
  updateTeacher,
  getTeacherInfoByUserId,
  getTeacherSchedules,
  editTeacherInfo,
} from "../controllers/teachersController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getTeachers);

router.get("/me", authenticate, authorize("teacher"), getTeacherInfoByUserId);
router.patch("/me", authenticate, authorize("teacher"), editTeacherInfo);
router.get(
  "/me/schedules",
  authenticate,
  authorize("teacher"),
  getTeacherSchedules,
);

router.get("/:teacher_id", authenticate, authorize("admin"), getTeacherInfo);

router.patch("/:teacher_id", authenticate, authorize("admin"), updateTeacher);

export default router;

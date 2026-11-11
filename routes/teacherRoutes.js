import express from "express";

import {
  getTeachers,
  getTeacherInfo,
  updateTeacher,
  getTeacherInfoByUserId,
  getTeacherSchedules,
  editTeacherInfo,
  getAssignedSections,
  getAttendanceStudents,
  saveAttendance,
  getMonthlyAttendanceReport,
} from "../controllers/teachersController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getTeachers);

router.get("/me", authenticate, authorize("teacher"), getTeacherInfoByUserId);
router.get(
  "/me/assigned-sections",
  authenticate,
  authorize("teacher"),
  getAssignedSections,
);
router.patch("/me", authenticate, authorize("teacher"), editTeacherInfo);
router.get(
  "/me/schedules",
  authenticate,
  authorize("teacher"),
  getTeacherSchedules,
);
router.get(
  "/me/attendance/students",
  authenticate,
  authorize("teacher"),
  getAttendanceStudents,
);

router.get(
  "/me/attendance/report",
  authenticate,
  authorize("teacher"),
  getMonthlyAttendanceReport,
);

router.post(
  "/me/attendance",
  authenticate,
  authorize("teacher"),
  saveAttendance,
);

router.get("/:teacher_id", authenticate, authorize("admin"), getTeacherInfo);

router.patch("/:teacher_id", authenticate, authorize("admin"), updateTeacher);

export default router;

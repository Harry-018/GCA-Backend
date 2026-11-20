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
  getStudentGradesOfSection,
  uploadGradesToStudents,
  getTeacherGradingQuarters,
  getTeacherGradingSubjects,
  uploadQuarterlyRemarks,
  getTeacherRemarksStudents,
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

router.post(
  "/grading/remarks/upload",
  authenticate,
  authorize("teacher"),
  uploadQuarterlyRemarks,
);
router.get(
  "/grading/remarks/students",
  authenticate,
  authorize("teacher"),
  getTeacherRemarksStudents,
);

router.get(
  "/grading/students",
  authenticate,
  authorize("teacher"),
  getStudentGradesOfSection,
);
router.get(
  "/grading/quarters",
  authenticate,
  authorize("teacher"),
  getTeacherGradingQuarters,
);

router.get(
  "/grading/subjects",
  authenticate,
  authorize("teacher"),
  getTeacherGradingSubjects,
);

router.post(
  "/grading/upload",
  authenticate,
  authorize("teacher"),
  uploadGradesToStudents,
);

export default router;

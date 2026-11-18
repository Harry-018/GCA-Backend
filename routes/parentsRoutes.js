import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import {
  getParents,
  getParentInfoByUserId,
  editParentInfo,
  getParentDashboardStudents,
  getParentAnnouncements,
  getStudentSubjects,
  getStudentSubjectGrades,
  getStudentTeacherRemarks,
} from "../controllers/parentsController.js";

const router = express.Router();

// Admin
router.get("/", authenticate, authorize("admin"), getParents);

// Parent information
router.get("/me", authenticate, authorize("parent"), getParentInfoByUserId);
router.patch("/me", authenticate, authorize("parent"), editParentInfo);

router.get(
  "/me/dashboard/students",
  authenticate,
  authorize("parent"),
  getParentDashboardStudents,
);

router.get(
  "/me/dashboard/announcements",
  authenticate,
  authorize("parent"),
  getParentAnnouncements,
);

// Parent dashboard - student subjects
router.get(
  "/me/dashboard/students/:stu_id/subjects",
  authenticate,
  authorize("parent"),
  getStudentSubjects,
);

// Parent dashboard - student subject grades
router.get(
  "/me/dashboard/students/:stu_id/subjects/:subject_id/grades",
  authenticate,
  authorize("parent"),
  getStudentSubjectGrades,
);

// Parent dashboard - overall teacher remarks
router.get(
  "/me/dashboard/students/:stu_id/teacher-remarks",
  authenticate,
  authorize("parent"),
  getStudentTeacherRemarks,
);

export default router;

import express from "express";
import {
  getStudents,
  getStudentInfo,
  getStudentEnrollments,
  editStudent,
} from "../controllers/officialStudentsController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getStudents);

router.get("/:stu_id", authenticate, authorize("admin"), getStudentInfo);

router.patch("/:stu_id", authenticate, authorize("admin"), editStudent);

router.get(
  "/:stu_id/enrollments",
  authenticate,
  authorize("admin"),
  getStudentEnrollments,
);

export default router;

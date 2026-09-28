import express from "express";

import {
  getSectionGradeLevels,
  getSectionsByGradeLevel,
  getSectionDetails,
  createSection,
  editSection,
  changeSectionTeacher,
  updateSectionStatus,
  searchStudentsForSection,
  addStudentsToSection,
  removeStudentsFromSection,
  promoteStudents,
} from "../controllers/sectionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// router.get("/grade-level", getSectionGradeLevels);
// router.get("/:section_id", authenticate, authorize("admin"), getSectionDetails);

router.get(
  "/grade-levels",
  authenticate,
  authorize("admin"),
  getSectionGradeLevels,
);

router.get(
  "/grade-level/:sy_grade_level_id",
  authenticate,
  authorize("admin"),
  getSectionsByGradeLevel,
);

router.get("/:section_id", authenticate, authorize("admin"), getSectionDetails);

router.post("/", authenticate, authorize("admin"), createSection);

router.put("/:section_id", authenticate, authorize("admin"), editSection);

router.patch(
  "/:section_id/status",
  authenticate,
  authorize("admin"),
  updateSectionStatus,
);

router.get(
  "/:section_id/students/search",
  authenticate,
  authorize("admin"),
  searchStudentsForSection,
);

router.post(
  "/:section_id/students",
  authenticate,
  authorize("admin"),
  addStudentsToSection,
);

router.post("/promote", authenticate, authorize("admin"), promoteStudents);

router.patch(
  "/:section_id/students/remove",
  authenticate,
  authorize("admin"),
  removeStudentsFromSection,
);

router.patch(
  "/:section_id/teacher",
  authenticate,
  authorize("admin"),
  changeSectionTeacher,
);

export default router;

// assign section button
// reactivate section
// change teacher
// promote student
// add student
// search student
// section schedule (add after schedule page is done)

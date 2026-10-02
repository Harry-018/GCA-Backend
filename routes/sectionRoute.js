import express from "express";
import {
  getSectionGradeLevels,
  getSectionsByGradeLevel,
  getSectionDetails,
  assignSection,
  changeSectionTeacher,
  updateSectionStatus,
  searchStudentsForSection,
  addStudentsToSection,
  removeStudentsFromSection,
  promoteStudents,
  getAdviserTeachers,
  getSections,
} from "../controllers/sectionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
const router = express.Router();
/* * Section list */ router.get(
  "/",
  authenticate,
  authorize("admin"),
  getSections,
);
/* * Assign an existing master section name * to a school-year/grade-level. */ router.post(
  "/",
  authenticate,
  authorize("admin"),
  assignSection,
);
/* * Grade-level section overview */ router.get(
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
/* * Adviser teachers */ router.get(
  "/advisers",
  authenticate,
  authorize("admin"),
  getAdviserTeachers,
);
/* * Individual section */ router.get(
  "/:section_id",
  authenticate,
  authorize("admin"),
  getSectionDetails,
);

/* * Section status */ router.patch(
  "/:section_id/status",
  authenticate,
  authorize("admin"),
  updateSectionStatus,
);
/* * Adviser */ router.patch(
  "/:section_id/teacher",
  authenticate,
  authorize("admin"),
  changeSectionTeacher,
);
/* * Student search */ router.get(
  "/:section_id/students/search",
  authenticate,
  authorize("admin"),
  searchStudentsForSection,
);
/* * Students */ router.post(
  "/:section_id/students",
  authenticate,
  authorize("admin"),
  addStudentsToSection,
);
router.patch(
  "/:section_id/students/remove",
  authenticate,
  authorize("admin"),
  removeStudentsFromSection,
);
/* * Promotion */ router.post(
  "/promote",
  authenticate,
  authorize("admin"),
  promoteStudents,
);
export default router;

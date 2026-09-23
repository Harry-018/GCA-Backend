import express from "express";
import {
  getSchoolYears,
  getSchoolYearInfo,
  createSchoolYear,
  editSchoolYear,
  getGradeLevels,
  getGradeLevelInfo,
  createGradeLevel,
  editGradeLevel,
  getAvailableGradelevels,
  addGradelevelsToSchoolYears,
  removeGradeLevelFromSchoolYear,
  getSubjectsInGradeLevel,
  addSubjectToGradeLevel,
  removeSubjectFromGradeLevel,
} from "../controllers/academicController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/school-year", authenticate, authorize("admin"), getSchoolYears);

router.get(
  "/school-year/:school_year_id",
  authenticate,
  authorize("admin"),
  getSchoolYearInfo,
);

router.post("/school-year", authenticate, authorize("admin"), createSchoolYear);

router.patch(
  "/school-year/:school_year_id",
  authenticate,
  authorize("admin"),
  editSchoolYear,
);

// gradelvels
router.get("/grade-level", authenticate, authorize("admin"), getGradeLevels);

router.get(
  "/grade-level/:grade_level_id",
  authenticate,
  authorize("admin"),
  getGradeLevelInfo,
);

router.post("/grade-level", authenticate, authorize("admin"), createGradeLevel);

router.patch(
  "/grade-level/:grade_level_id",
  authenticate,
  authorize("admin"),
  editGradeLevel,
);

// gradelevel schoolyear
router.get(
  "/gradelevel-schoolyear",
  authenticate,
  authorize("admin"),
  getAvailableGradelevels,
);

router.post(
  "/gradelevel-schoolyear",
  authenticate,
  authorize("admin"),
  addGradelevelsToSchoolYears,
);

router.patch(
  "/gradelevel-schoolyear",
  authenticate,
  authorize("admin"),
  removeGradeLevelFromSchoolYear,
);

// subject grade level
router.get(
  "/grade-level/:sy_grade_level_id/subjects",
  authenticate,
  authorize("admin"),
  getSubjectsInGradeLevel,
);

router.post(
  "/grade-level/subjects",
  authenticate,
  authorize("admin"),
  addSubjectToGradeLevel,
);

router.patch(
  "/grade-level/subjects/:sy_gradelevel_subject_id",
  authenticate,
  authorize("admin"),
  removeSubjectFromGradeLevel,
);
export default router;

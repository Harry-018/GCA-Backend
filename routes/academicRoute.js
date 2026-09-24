import express from "express";
import {
  getSchoolYears,
  getSchoolYearInfo,
  createSchoolYear,
  editSchoolYear,
  // ================
  getGradeLevels,
  getGradeLevelInfo,
  createGradeLevel,
  editGradeLevel,
  // ================
  getGradeLevelBySchoolYearGradeLevel,
  getAvailableGradelevels,
  addGradelevelsToSchoolYears,
  removeGradeLevelFromSchoolYear,
  // ================
  getSubjects,
  getSubjectsByGradeLevel,
  getSubjectsInGradeLevel,
  addSubjectsToGradeLevel,
  removeSubjectFromGradeLevel,
  // ================
  getSkillsBySubject,
  getSkillsByGradeLevelSubject,
  getAvailableSkillsByGradeLevelSubject,
  addSkillToSubject,
  assignSkillsToGradeLevelSubject,
  editSkill,
  archiveSkill,
  restoreSkill,
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
router.get("/grade-level", getGradeLevels);

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
router.get("/gradelevel-schoolyear", getAvailableGradelevels);

router.get(
  "/schoolyear-gradelevel/:sy_grade_level_id",
  authenticate,
  authorize("admin"),
  getGradeLevelBySchoolYearGradeLevel,
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

// subject grade level ==========================================================================================

router.get("/subjects", authenticate, authorize("admin"), getSubjects);

router.get(
  "/grade-level/:sy_grade_level_id/subjects/available",
  authenticate,
  authorize("admin"),
  getSubjectsByGradeLevel,
);

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
  addSubjectsToGradeLevel,
);

router.patch(
  "/grade-level/subjects/:sy_gradelevel_subject_id",
  authenticate,
  authorize("admin"),
  removeSubjectFromGradeLevel,
);

// skills ==========================================================================================

// Get all master skills belonging to a subject
router.get(
  "/subject/:subject_id/skills",
  authenticate,
  authorize("admin"),
  getSkillsBySubject,
);

// Get skills assigned to a specific grade-level subject
router.get(
  "/grade-level-subject/:sy_gradelevel_subject_id/skills",
  authenticate,
  authorize("admin"),
  getSkillsByGradeLevelSubject,
);

router.get(
  "/grade-level-subject/:sy_gradelevel_subject_id/skills/available",
  authenticate,
  authorize("admin"),
  getAvailableSkillsByGradeLevelSubject,
);

// Create a new master skill under a subject
router.post(
  "/subject/:subject_id/skills",
  authenticate,
  authorize("admin"),
  addSkillToSubject,
);

// Assign an existing skill to a grade-level subject
router.post(
  "/grade-level-subject/:sy_gradelevel_subject_id/skills",
  authenticate,
  authorize("admin"),
  assignSkillsToGradeLevelSubject,
);

// Edit a master skill
router.patch(
  "/subject/:subject_id/skills/:skill_id",
  authenticate,
  authorize("admin"),
  editSkill,
);

// Archive a skill assignment
router.patch(
  "/grade-level-subject/:sy_gradelevel_subject_id/skills/:skill_id/archive",
  authenticate,
  authorize("admin"),
  archiveSkill,
);

// Restore a skill assignment
router.patch(
  "/grade-level-subject/:sy_gradelevel_subject_id/skills/:skill_id/restore",
  authenticate,
  authorize("admin"),
  restoreSkill,
);

export default router;

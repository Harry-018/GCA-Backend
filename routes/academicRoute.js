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

router.delete(
  "/gradelevel-schoolyear",
  authenticate,
  authorize("admin"),
  removeGradeLevelFromSchoolYear,
);

export default router;

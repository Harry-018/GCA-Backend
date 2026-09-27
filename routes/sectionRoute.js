import express from "express";

import {
  getSectionGradeLevels,
  getSectionDetails,
  createSection,
  editSection,
  updateSectionStatus,
  getSectionsByGradeLevel,
} from "../controllers/sectionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// router.get("/grade-level", getSectionGradeLevels);
// router.get("/:section_id", authenticate, authorize("admin"), getSectionDetails);

router.get("/grade-levels", getSectionGradeLevels);

router.get("/grade-level/:sy_grade_level_id", getSectionsByGradeLevel);

router.get("/:section_id", getSectionDetails);

router.post("/", createSection);

router.put("/:section_id", editSection);

router.patch("/:section_id/status", updateSectionStatus);

export default router;

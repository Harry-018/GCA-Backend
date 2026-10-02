import express from "express";

import * as comc from "../controllers/communicationController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================
// ANNOUNCEMENTS
// =====================

// Get active grade levels with announcement counts
router.get(
  "/",
  authenticate,
  authorize("admin"),
  comc.getGradeLevelWithAnnouncementCount,
);

// Get announcements for a grade level
router.get(
  "/:sy_grade_level_id",
  authenticate,
  authorize("admin", "parent"),
  comc.getAnnouncementsByGradeLevel,
);

// Create announcement
router.post(
  "/:sy_grade_level_id",
  authenticate,
  authorize("admin"),
  comc.createAnnouncementInGradeLevel,
);

// Edit announcement
router.put(
  "/:sy_grade_level_id/:announcement_id",
  authenticate,
  authorize("admin"),
  comc.editAnnouncementInGradeLevel,
);

// Delete announcement
router.delete(
  "/:sy_grade_level_id/:announcement_id",
  authenticate,
  authorize("admin"),
  comc.deleteAnnouncementInGradeLevel,
);

export default router;

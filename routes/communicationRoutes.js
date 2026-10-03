import express from "express";

import * as comc from "../controllers/communicationController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// =============
// notifications
// =============
router.get(
  "/notification-templates",
  authenticate,
  authorize("admin"),
  comc.getNotificationTemplates,
);

router.get(
  "/payment-options",
  authenticate,
  authorize("admin"),
  comc.getPaymentOptions,
);

router.post(
  "/notifications/recipients",
  authenticate,
  authorize("admin"),
  comc.sendTuitionReminderNotification,
);

router.get(
  "/notifications",
  authenticate,
  authorize("admin"),
  comc.getNotifications,
);

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

// it now sends the email. lets connect it to the frontend here are the files:

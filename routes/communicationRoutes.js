import express from "express";

import * as comc from "../controllers/communicationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================
// NOTIFICATIONS
// =====================

router.get(
  "/notification-audiences",
  authenticate,
  authorize("admin"),
  comc.getNotificationAudiences,
);

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

router.get(
  "/notifications",
  authenticate,
  authorize("admin"),
  comc.getNotifications,
);

router.post(
  "/notifications/send",
  authenticate,
  authorize("admin"),
  comc.sendNotification,
);

// =====================
// ANNOUNCEMENTS
// =====================

router.get(
  "/",
  authenticate,
  authorize("admin"),
  comc.getGradeLevelWithAnnouncementCount,
);

router.get(
  "/:sy_grade_level_id",
  authenticate,
  authorize("admin", "parent"),
  comc.getAnnouncementsByGradeLevel,
);

router.post(
  "/:sy_grade_level_id",
  authenticate,
  authorize("admin"),
  comc.createAnnouncementInGradeLevel,
);

router.put(
  "/:sy_grade_level_id/:announcement_id",
  authenticate,
  authorize("admin"),
  comc.editAnnouncementInGradeLevel,
);

router.delete(
  "/:sy_grade_level_id/:announcement_id",
  authenticate,
  authorize("admin"),
  comc.deleteAnnouncementInGradeLevel,
);

export default router;

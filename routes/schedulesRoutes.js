import express from "express";

import {
  getScheduleGradeLevels,
  getScheduleSections,
  getScheduleSubjects,
  getScheduleRooms,
  getScheduleDays,
  getScheduleTimes,
  getSchedulesBySection,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/schedulesController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// School years / grade levels available for scheduling
router.get(
  "/grade-levels",
  authenticate,
  authorize("admin"),
  getScheduleGradeLevels,
);

// Sections under a selected school-year grade level
router.get(
  "/grade-levels/:sy_grade_level_id/sections",
  authenticate,
  authorize("admin"),
  getScheduleSections,
);

// Subjects available for the selected grade level
router.get(
  "/sections/:section_id/subjects",
  authenticate,
  authorize("admin"),
  getScheduleSubjects,
);

// Rooms
router.get("/rooms", authenticate, authorize("admin"), getScheduleRooms);

// Days
router.get("/days", authenticate, authorize("admin"), getScheduleDays);

// Schedule time options
router.get("/times", authenticate, authorize("admin"), getScheduleTimes);

/*
 * Section schedules
 */

// Get all schedules for one section
router.get(
  "/sections/:section_id",
  authenticate,
  authorize("admin"),
  getSchedulesBySection,
);

// Add schedule
router.post("/", authenticate, authorize("admin"), createSchedule);

// Edit schedule
router.put("/:schedule_id", authenticate, authorize("admin"), updateSchedule);

// Remove schedule
router.delete(
  "/:schedule_id",
  authenticate,
  authorize("admin"),
  deleteSchedule,
);

export default router;

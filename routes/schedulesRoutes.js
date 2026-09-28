import express from "express";

import {
  getScheduleGradeLevels,
  getScheduleSections,
  getSectionSchedules,
  getScheduleSubjects,
  getScheduleTeachers,
  getScheduleRooms,
  getScheduleDays,
  getScheduleTimes,
  createSchedule,
  editSchedule,
  deleteSchedule,
} from "../controllers/schedulesController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/grade-levels",
  authenticate,
  authorize("admin"),
  getScheduleGradeLevels,
);

router.get(
  "/grade-levels/:sy_grade_level_id/sections",
  authenticate,
  authorize("admin"),
  getScheduleSections,
);

router.get(
  "/sections/:section_id/subjects",
  authenticate,
  authorize("admin"),
  getScheduleSubjects,
);

router.get("/teachers", authenticate, authorize("admin"), getScheduleTeachers);

router.get("/rooms", authenticate, authorize("admin"), getScheduleRooms);

router.get("/days", authenticate, authorize("admin"), getScheduleDays);

router.get("/times", authenticate, authorize("admin"), getScheduleTimes);

router.get(
  "/sections/:section_id",
  authenticate,
  authorize("admin"),
  getSectionSchedules,
);
router.post("/", authenticate, authorize("admin"), createSchedule);

router.put("/:schedule_id", authenticate, authorize("admin"), editSchedule);

router.delete(
  "/:schedule_id",
  authenticate,
  authorize("admin"),
  deleteSchedule,
);
export default router;

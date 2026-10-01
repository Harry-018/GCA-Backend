import express from "express";
import * as setc from "../controllers/settingsController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/subjects", authenticate, authorize("admin"), setc.getAllSubjects);

router.post("/subjects", authenticate, authorize("admin"), setc.createSubject);

router.post("/skills", authenticate, authorize("admin"), setc.createSkill);

router.patch(
  "/skills/:skillId",
  authenticate,
  authorize("admin"),
  setc.updateSkill,
);

router.patch(
  "/skills/:skillId/archive",
  authenticate,
  authorize("admin"),
  setc.removeSkill,
);

router.get(
  "/skills/subject/:subjectId",
  authenticate,
  authorize("admin"),
  setc.getSkillsBySubject,
);

router.patch(
  "/subjects/:subjectId",
  authenticate,
  authorize("admin"),
  setc.renameSubject,
);

router.get(
  "/subjects/grade-level/:gradeLevelId",
  authenticate,
  authorize("admin"),
  setc.getSubjectsByGradeLevel,
);

router.post(
  "/subjects/grade-level/:gradeLevelId",
  authenticate,
  authorize("admin"),
  setc.addSubjectToGradeLevel,
);

router.patch(
  "/subjects/grade-level/assignment/:syGradelevelSubjectId",
  authenticate,
  authorize("admin"),
  setc.removeSubjectFromGradeLevel,
);

export default router;

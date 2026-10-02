import express from "express";
import * as setc from "../controllers/settingsController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

//sections
router.get(
  "/section-names",
  authenticate,
  authorize("admin"),
  setc.getSectionNames,
);

router.get(
  "/section-names/archived",
  authenticate,
  authorize("admin"),
  setc.getArchivedSectionNames,
);

router.post(
  "/section-names",
  authenticate,
  authorize("admin"),
  setc.createSectionName,
);

router.patch(
  "/section-names/:section_name_id",
  authenticate,
  authorize("admin"),
  setc.renameSectionName,
);

router.patch(
  "/section-names/:section_name_id/archive",
  authenticate,
  authorize("admin"),
  setc.archiveSectionName,
);

router.patch(
  "/section-names/:section_name_id/restore",
  authenticate,
  authorize("admin"),
  setc.restoreSectionName,
);

//subjects

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
  "/subjects/:subjectId/archive",
  authenticate,
  authorize("admin"),
  setc.removeSubject,
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

router.get(
  "/skills/subject/:subjectId/archived",
  authenticate,
  authorize("admin"),
  setc.getArchivedSkillsBySubject,
);

router.patch(
  "/skills/:skillId/reactivate",
  authenticate,
  authorize("admin"),
  setc.reactivateSkill,
);

export default router;

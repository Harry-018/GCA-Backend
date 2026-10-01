import express from "express";
import * as setc from "../controllers/settingsController.js";

const router = express.Router();

router.get("/subjects", setc.getAllSubjects);

router.post("/subjects", setc.createSubject);

router.post("/skills", setc.createSkill);

router.patch("/skills/:skillId", setc.updateSkill);

router.patch("/skills/:skillId/archive", setc.removeSkill);

router.get("/skills/subject/:subjectId", setc.getSkillsBySubject);

router.patch("/subjects/:subjectId", setc.renameSubject);

router.get("/subjects/grade-level/:gradeLevelId", setc.getSubjectsByGradeLevel);

router.post("/subjects/grade-level/:gradeLevelId", setc.addSubjectToGradeLevel);

router.patch(
  "/subjects/grade-level/assignment/:syGradelevelSubjectId",
  setc.removeSubjectFromGradeLevel,
);

export default router;

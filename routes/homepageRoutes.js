import express from "express";
import * as hmc from "../controllers/homepageController.js";
import { upload, videoUpload } from "../middleware/uploadMiddleware.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== Banner ====================

router.get("/banner", hmc.getBanner);
router.patch(
  "/banner",
  authenticate,
  authorize("admin"),
  upload.single("banner_image"),
  hmc.editBanner,
);

// ==================== Video ====================

router.get("/video", hmc.getVideo);

router.patch(
  "/video",
  authenticate,
  authorize("admin"),
  videoUpload.single("video"),
  hmc.editVideo,
);

// ==================== Choose Us ====================

router.get("/reasons", hmc.getReasons);
router.post("/reasons", authenticate, authorize("admin"), hmc.addReason);
router.patch(
  "/reasons/:reason_id",
  authenticate,
  authorize("admin"),
  hmc.editReason,
);
router.delete(
  "/reasons/:reason_id",
  authenticate,
  authorize("admin"),
  hmc.deleteReason,
);

// ==================== Academic Programs ====================

router.get("/academic-programs", hmc.getAcademicPrograms);

router.get(
  "/grade-levels",
  authenticate,
  authorize("admin"),
  hmc.getGradeLevels,
);

router.post(
  "/academic-programs",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  hmc.addAcademicProgram,
);

router.patch(
  "/academic-programs/:program_id",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  hmc.editAcademicProgram,
);

router.delete(
  "/academic-programs/:program_id",
  authenticate,
  authorize("admin"),
  hmc.deleteAcademicProgram,
);

// ==================== Mission Vision ====================

router.get("/mission-vision", hmc.getMissionVision);
router.patch(
  "/mission-vision",
  authenticate,
  authorize("admin"),
  hmc.editMissionVision,
);

// ==================== Children Activities ====================

router.get("/children-activities", hmc.getChildrenActivities);

router.post(
  "/children-activities",
  authenticate,
  authorize("admin"),
  upload.single("activityImage"),
  hmc.addChildrenActivity,
);

router.patch(
  "/children-activities/:activity_id",
  authenticate,
  authorize("admin"),
  upload.single("activityImage"),
  hmc.editChildrenActivity,
);

router.delete(
  "/children-activities/:activity_id",
  authenticate,
  authorize("admin"),
  hmc.deleteChildrenActivity,
);

export default router;

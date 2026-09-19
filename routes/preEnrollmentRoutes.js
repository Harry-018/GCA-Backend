import express from "express";
import {
  createApplication,
  getRecentApplications,
  getApplications,
  getApplicant,
  approveApplicant,
  bulkApproveApplicants,
  getRejectionReasons,
  rejectApplicant,
  getApprovedApplicants,
  enrollApplicant,
} from "../controllers/preEnrollmentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/application", createApplication);
router.get(
  "/applications/recent",
  authenticate,
  authorize("admin"),
  getRecentApplications,
);
router.get("/applications", authenticate, authorize("admin"), getApplications);
router.get(
  "/applications/:application_id",
  authenticate,
  authorize("admin"),
  getApplicant,
);
router.post(
  "/app-approval",
  authenticate,
  authorize("admin"),
  approveApplicant,
);
router.patch(
  "/app-approval",
  authenticate,
  authorize("admin"),
  bulkApproveApplicants,
);

router.get(
  "/rejection-reasons",
  authenticate,
  authorize("admin"),
  getRejectionReasons,
);
router.patch(
  "/applications/:application_id/reject",
  authenticate,
  authorize("admin"),
  rejectApplicant,
);
router.get(
  "/app-approval",
  authenticate,
  authorize("admin"),
  getApprovedApplicants,
);
router.post(
  "/students/:app_approval_id",
  authenticate,
  authorize("admin"),
  enrollApplicant,
);
export default router;

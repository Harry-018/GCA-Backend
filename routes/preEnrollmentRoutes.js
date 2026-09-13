import express from "express";
import {
  createApplication,
  getRecentApplications,
  getApplications,
  getApplicant,
  approveApplicant,
  bulkApproveApplicants,
  rejectApplicant,
  getApprovedApplicants,
  enrollApplicant,
} from "../controllers/preEnrollmentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/application", createApplication);

router.get("/test", authenticate, authorize("admin"), (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user,
  });
});

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
  "/app_approval",
  authenticate,
  authorize("admin"),
  approveApplicant,
);

router.post(
  "/app-approval",
  authenticate,
  authorize("admin"),
  bulkApproveApplicants,
);

router.patch(
  "/app-approval",
  authenticate,
  authorize("admin"),
  bulkApproveApplicants,
);

router.patch(
  "/applications/:application_id/reject",
  authenticate,
  authorize("admin"),
  rejectApplicant,
);

router.get(
  "/app_approval",
  authenticate,
  authorize("admin"),
  getApprovedApplicants,
);

router.post("/students", authenticate, authorize("admin"), enrollApplicant);

export default router;

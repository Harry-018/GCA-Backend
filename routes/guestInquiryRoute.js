import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

import {
  getInquiries,
  createInquiry,
  replyToInquiry,
  markInquiryAsRead,
} from "../controllers/guestInquiryController.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getInquiries);

router.post("/", createInquiry);

// Admin replies
router.put(
  "/:inquire_id/reply",
  authenticate,
  authorize("admin"),
  replyToInquiry,
);

router.patch(
  "/:inquire_id/read",
  authenticate,
  authorize("admin"),
  markInquiryAsRead,
);

export default router;

import * as tuic from "../controllers/tuitionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

import express from "express";

const router = express.Router();

// GET
router.get("/grade-levels", tuic.getGradeLevel);
router.get("/:grade_level_id", tuic.getTuition);

// POST
router.post("/", tuic.createGrade);
router.post("/payment-option", tuic.createPaymentOption);

// PATCH
router.patch("/fees/:fees_id", tuic.patchFees);

router.patch("/payment-option/:payment_option_id", tuic.patchPaymentOption);

router.patch(
  "/grade-payment-option/:gradelevel_paymentoption_id",
  tuic.patchGradePaymentOption,
);

export default router;

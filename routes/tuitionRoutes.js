import * as tuic from "../controllers/tuitionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

import express from "express";

const router = express.Router();

// GET
// Grade levels currently configured with tuition
router.get("/grade-levels", tuic.getTuitionGradeLevels);

// All master grade levels
router.get("/all-grade-levels", tuic.getGradeLevel);

// Tuition details for a specific configured grade
router.get("/:grade_level_id", tuic.getTuition);

// POST
// Create tuition configuration for a grade level
router.post("/", tuic.createGrade);

// Create a new master payment option
// and automatically apply it to all configured grade levels
router.post("/payment-option", tuic.createPaymentOption);

// PATCH
// Update fees and recalculate all related amounts
router.patch("/fees/:fees_id", tuic.patchFees);

// Update master payment option
router.patch("/payment-option/:payment_option_id", tuic.patchPaymentOption);

// Update discount for a specific grade/payment option
router.patch(
  "/grade-payment-option/:gradelevel_paymentoption_id",
  tuic.patchGradePaymentOption,
);

// DELETE
// Delete tuition configuration for a grade level
router.delete("/grade/:grade_level_id", tuic.deleteGrade);

export default router;

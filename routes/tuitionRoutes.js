import * as tuic from "../controllers/tuitionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

import express from "express";

const router = express.Router();

// GET
// Grade levels currently configured with tuition
router.get("/grade-levels", tuic.getTuitionGradeLevels);

// All master grade levels
router.get(
  "/all-grade-levels",
  authenticate,
  authorize("admin"),
  tuic.getGradeLevel,
);

// Tuition details for a specific configured grade
router.get("/:grade_level_id", tuic.getTuition);

// POST
// Create tuition configuration for a grade level
router.post("/", authenticate, authorize("admin"), tuic.createGrade);

// Create a new master payment option
// and automatically apply it to all configured grade levels
router.post(
  "/payment-option",
  authenticate,
  authorize("admin"),
  tuic.createPaymentOption,
);

// PATCH
// Update fees and recalculate all related amounts
router.patch(
  "/fees/:fees_id",
  authenticate,
  authorize("admin"),
  tuic.patchFees,
);

// Update master payment option
router.patch(
  "/payment-option/:payment_option_id",
  authenticate,
  authorize("admin"),
  tuic.patchPaymentOption,
);

// Update discount for a specific grade/payment option
router.patch(
  "/grade-payment-option/:gradelevel_paymentoption_id",
  authenticate,
  authorize("admin"),
  tuic.patchGradePaymentOption,
);

// DELETE
// Delete tuition configuration for a grade level
router.delete(
  "/grade/:grade_level_id",
  authenticate,
  authorize("admin"),
  tuic.deleteGrade,
);

router.delete(
  "/payment-option",
  authenticate,
  authorize("admin"),
  tuic.deleteOption,
);

export default router;

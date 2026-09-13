import express from "express";
import {
  getPaymentOptions,
  createPaymentOption,
  editPaymentOption,
  deletePaymentOption,
  getFeesInGradeLevels,
  getPaymentOptionsInGradeLevels,
  addFeesPaymentInGradeLevel,
  editGradeLevelFees,
  deleteGradeLevelFees,
} from "../controllers/paymentOptionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/payment-option",
  authenticate,
  authorize("admin"),
  getPaymentOptions,
);

router.post(
  "/payment-option",
  authenticate,
  authorize("admin"),
  createPaymentOption,
);

router.patch(
  "/payment-option/:payment_option_id",
  authenticate,
  authorize("admin"),
  editPaymentOption,
);

router.delete(
  "/payment-option/:payment_option_id",
  authenticate,
  authorize("admin"),
  deletePaymentOption,
);

router.get(
  "/fees-gradelevel/:grade_level_id",
  authenticate,
  authorize("admin"),
  getFeesInGradeLevels,
);

router.get(
  "/payment-gradelevel/:grade_level_id",
  authenticate,
  authorize("admin"),
  getPaymentOptionsInGradeLevels,
);

router.post(
  "/fees-gradelevel",
  authenticate,
  authorize("admin"),
  addFeesPaymentInGradeLevel,
);

router.patch(
  "/fees-gradelevel/:grade_level_id",
  authenticate,
  authorize("admin"),
  editGradeLevelFees,
);

router.delete(
  "/fees-gradelevel/:grade_level_id",
  authenticate,
  authorize("admin"),
  deleteGradeLevelFees,
);
export default router;

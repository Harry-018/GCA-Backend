import express from "express";
import {
  getPaymentOptions,
  editPaymentOption,
  getFeesInGradeLevels,
  getPaymentOptionsInGradeLevels,
  addFeesPaymentInGradeLevel,
  editGradeLevelFees,
  deleteGradeLevelFees,
} from "../controllers/paymentOptionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/payment-option", getPaymentOptions);

router.patch(
  "/payment-option/:payment_option_id",
  authenticate,
  authorize("admin"),
  editPaymentOption,
);

router.get("/fees-gradelevel/:grade_level_id", getFeesInGradeLevels);

router.get(
  "/payment-gradelevel/:grade_level_id",
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

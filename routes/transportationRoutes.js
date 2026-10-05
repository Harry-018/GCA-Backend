import express from "express";
import * as tranc from "../controllers/transportationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// GET TRANSPORTATION
// ==============================

router.get("/routes", tranc.getTransportation);

// ==============================
// ADD TRANSPORTATION
// ==============================

router.post(
  "/routes",
  authenticate,
  authorize("admin"),
  tranc.addTransportation,
);

// ==============================
// EDIT TRANSPORTATION
// ==============================

router.patch(
  "/routes/:transportation_id",
  authenticate,
  authorize("admin"),
  tranc.editTransportation,
);

// ==============================
// DELETE TRANSPORTATION
// ==============================

router.delete(
  "/routes/:transportation_id/delete",
  authenticate,
  authorize("admin"),
  tranc.deleteTransportation,
);

export default router;

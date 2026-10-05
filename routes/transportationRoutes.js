import express from "express";
import * as tranc from "../controllers/transportationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// GET TRANSPORTATION
// ==============================

router.get("/", tranc.getTransportation);

// ==============================
// ADD TRANSPORTATION
// ==============================

router.post("/", authenticate, authorize("admin"), tranc.addTransportation);

// ==============================
// EDIT TRANSPORTATION
// ==============================

router.patch(
  "/:transportation_id",
  authenticate,
  authorize("admin"),
  tranc.editTransportation,
);

// ==============================
// DELETE TRANSPORTATION
// ==============================

router.delete(
  "/:transportation_id/delete",
  authenticate,
  authorize("admin"),
  tranc.deleteTransportation,
);

export default router;

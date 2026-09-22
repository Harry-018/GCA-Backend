import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { getParents } from "../controllers/parentsController.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getParents);

export default router;

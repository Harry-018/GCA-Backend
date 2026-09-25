import express from "express";

import {
  createAccountInvitation,
  verifyAccountInvitation,
  activateAccount,
} from "../controllers/accountInvitationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createAccountInvitation);
router.get("/verify/:token", verifyAccountInvitation);
router.post("/activate", activateAccount);

export default router;

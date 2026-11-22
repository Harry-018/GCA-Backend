import express from "express";
import {
  getUserAccounts,
  inviteAccount,
  disableAccount,
  reactivateAccount,
} from "../controllers/userAccountsController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getUserAccounts);

router.post("/invite", authenticate, authorize("admin"), inviteAccount);

router.patch(
  "/:user_id/disable",
  authenticate,
  authorize("admin"),
  disableAccount,
);

router.patch(
  "/:user_id/reactivate",
  authenticate,
  authorize("admin"),
  reactivateAccount,
);

export default router;

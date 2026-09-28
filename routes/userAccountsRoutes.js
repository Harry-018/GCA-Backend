import express from "express";
import {
  getUserAccounts,
  inviteAccount,
  disableAccount,
  reactivateAccount,
} from "../controllers/userAccountsController.js";

const router = express.Router();

router.get("/", getUserAccounts);

router.post("/invite", inviteAccount);

router.patch("/:user_id/disable", disableAccount);

router.patch("/:user_id/reactivate", reactivateAccount);

export default router;

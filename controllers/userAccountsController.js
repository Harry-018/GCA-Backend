import { sendAccountActivationEmail } from "../emails/emailService.js";
import * as uam from "../models/userAccountsModel.js";

export const getUserAccounts = async (req, res) => {
  try {
    const {
      status = "all",
      role = "all",
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const result = await uam.getUserAccounts({
      status,
      role,
      search,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("getUserAccounts:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user accounts.",
    });
  }
};

export const inviteAccount = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const result = await uam.createAccountInvitation(Number(user_id));

    await sendAccountActivationEmail({
      email: result.user.email,
      token: result.token,
    });

    res.status(200).json({
      success: true,
      message: "Account invitation sent successfully.",
    });
  } catch (error) {
    console.error("inviteAccount:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to send account invitation.",
    });
  }
};

export const disableAccount = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await uam.disableAccount(Number(user_id));

    res.status(200).json({
      success: true,
      message: "Account disabled successfully.",
      data: result,
    });
  } catch (error) {
    console.error("disableAccount:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to disable account.",
    });
  }
};

export const reactivateAccount = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await uam.reactivateAccount(Number(user_id));

    res.status(200).json({
      success: true,
      message: "Account reactivated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("reactivateAccount:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to reactivate account.",
    });
  }
};

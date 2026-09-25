import * as aim from "../models/accountInvitationModel.js";

export const createAccountInvitation = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    const invitation = await aim.createAccountInvitation(Number(user_id));

    return res.status(201).json({
      message: "Account activation invitation created successfully.",
      data: invitation,
    });
  } catch (error) {
    console.error("Error creating account invitation:", error);

    if (
      error.message === "User account not found." ||
      error.message === "This account is not pending activation."
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create account activation invitation.",
    });
  }
};

export const verifyAccountInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Activation token is required.",
      });
    }

    const invitation = await aim.getAccountInvitation(token);

    if (!invitation) {
      return res.status(404).json({
        message: "Invalid account activation invitation.",
      });
    }

    if (!invitation.valid) {
      if (invitation.reason === "used") {
        return res.status(400).json({
          message: "This account activation invitation has already been used.",
        });
      }

      if (invitation.reason === "expired") {
        return res.status(400).json({
          message: "This account activation invitation has expired.",
        });
      }

      if (invitation.reason === "account_not_pending") {
        return res.status(400).json({
          message: "This account is not pending activation.",
        });
      }
    }

    return res.status(200).json({
      message: "Account activation invitation is valid.",
      data: invitation,
    });
  } catch (error) {
    console.error("Error verifying account invitation:", error);

    return res.status(500).json({
      message: "Failed to verify account activation invitation.",
    });
  }
};

export const activateAccount = async (req, res) => {
  try {
    const { activation_token, password } = req.body;

    if (!activation_token) {
      return res.status(400).json({
        message: "Activation token is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const account = await aim.activateAccount({
      activation_token,
      password,
    });

    return res.status(200).json({
      message: "Account activated successfully.",
      data: account,
    });
  } catch (error) {
    console.error("Error activating account:", error);

    if (
      error.message === "Invalid account activation invitation." ||
      error.message ===
        "This account activation invitation has already been used." ||
      error.message === "This account activation invitation has expired." ||
      error.message === "User account not found." ||
      error.message === "This account is not pending activation."
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to activate account.",
    });
  }
};

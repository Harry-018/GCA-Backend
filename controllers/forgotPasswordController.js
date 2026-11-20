import crypto from "crypto";
import { BrevoClient } from "@getbrevo/brevo";

import * as fm from "../models/forgotPasswordModel.js";
import { generateOtp, hashOtp } from "../functions/otp.js";
import { hashPassword } from "../functions/passwordHashing.js";

// SEND PASSWORD RESET OTP
export const sendPasswordResetCode = async (req, res) => {
  try {
    const email = req.body.email?.trim();

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    if (email.length > 100) {
      return res.status(400).json({
        message: "Invalid email address.",
      });
    }

    const account = await fm.getUserAccountByEmail(email);

    // Generate a verification record even when the account
    // is not found, so the response does not reveal account existence.
    const { otp, otpHash } = generateOtp();

    const verification_id = await fm.createPasswordResetVerification({
      email,
      otpHash,
    });

    // Only send an OTP to an existing active account.
    if (account?.account_status === "active") {
      const brevo = new BrevoClient({
        apiKey: process.env.BREVO_API_KEY,
      });

      await brevo.transactionalEmails.sendTransacEmail({
        subject: "Password Reset Verification Code",
        textContent: `Your password reset verification code is: ${otp}. This code expires in 15 minutes. Do not share this code with anyone.`,
        sender: {
          name: "Grace Christian Academy",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email }],
      });
    }

    return res.status(200).json({
      message:
        "If an active account exists with that email, a verification code has been sent.",
      data: {
        verification_id,
      },
    });
  } catch (error) {
    console.error("Send password reset code error:", error);

    return res.status(500).json({
      message: "Failed to send verification code.",
    });
  }
};

// VERIFY PASSWORD RESET OTP
export const verifyPasswordResetCode = async (req, res) => {
  try {
    const { verification_id, otp } = req.body;

    if (!verification_id || !otp) {
      return res.status(400).json({
        message: "Verification ID and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    const verification = await fm.getPasswordResetVerification(verification_id);

    if (!verification || verification.verified_at) {
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({
        message: "Verification code has expired.",
      });
    }

    const submittedHash = hashOtp(String(otp));

    if (submittedHash !== verification.otp_code) {
      return res.status(400).json({
        message: "Invalid verification code.",
      });
    }

    // Generate a separate, unpredictable password reset token.
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashOtp(resetToken);

    const verified = await fm.markPasswordResetVerified(
      verification_id,
      resetTokenHash,
    );

    if (!verified) {
      return res.status(400).json({
        message: "This verification code has already been used.",
      });
    }

    return res.status(200).json({
      message: "Verification successful.",
      data: {
        reset_token: resetToken,
      },
    });
  } catch (error) {
    console.error("Verify password reset code error:", error);

    return res.status(500).json({
      message: "Failed to verify code.",
    });
  }
};

// RESET USER PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { verification_id, reset_token, password } = req.body;

    if (!verification_id || !reset_token || !password) {
      return res.status(400).json({
        message: "Verification ID, reset token, and password are required.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password must not exceed 72 bytes.",
      });
    }

    const passwordHash = await hashPassword(password);
    const resetTokenHash = hashOtp(reset_token);

    await fm.resetUserPassword({
      verification_id,
      resetTokenHash,
      passwordHash,
    });

    return res.status(200).json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    const isInvalidRequest = [
      "Invalid password reset request.",
      "Password reset request has expired.",
      "Invalid password reset token.",
      "User account not found.",
    ].includes(error.message);

    return res.status(isInvalidRequest ? 400 : 500).json({
      message: isInvalidRequest ? error.message : "Failed to reset password.",
    });
  }
};

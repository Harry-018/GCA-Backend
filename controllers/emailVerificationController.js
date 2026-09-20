import { generateOtp, hashOtp } from "../functions/otp.js";
import { BrevoClient } from "@getbrevo/brevo";

import * as ev from "../models/emailVerificationModel.js";

export const createVerification = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const { otp, otpHash } = generateOtp();
    const brevo = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY,
    });

    if (!req.body.email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }
    if (!req.body.purpose) {
      return res.status(400).json({
        message: "Purpose is required",
      });
    }

    const verification_id = await ev.createVerification({
      email,
      otpHash,
      purpose,
    });

    //send otp to user email
    await brevo.transactionalEmails.sendTransacEmail({
      subject: "One-Time-Password for Account Verification",
      textContent: `Your verification code is: ${otp}. Please do not share this code with anyone.`,
      sender: {
        name: "Grace Christian Academy",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: req.body.email }],
    });

    console.log(otp);

    res.status(201).json({
      message: "verification code sent",
      data: {
        verification_id,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { verification_id, otp } = req.body;
    const verification = await ev.getVerification(verification_id);

    if (!verification) {
      return res.status(404).json({
        message: "Verification not found",
      });
    }

    if (verification.verified_at) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({
        message: "Verification code has expired",
      });
    }

    // Hash the OTP entered by the user
    const submittedHash = hashOtp(otp);

    // Compare it with the hash stored in the database
    if (submittedHash !== verification.otp_code) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    // OTP is correct
    await ev.verifyEmail(verification_id);
    res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const sendApplicationReceipt = async (req, res) => {};

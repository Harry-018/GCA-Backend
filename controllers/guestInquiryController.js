import * as gim from "../models/guestInquiryModel.js";
import { sendInquiryReplyEmail } from "../emails/emailService.js";

export const getInquiries = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const result = await gim.getInquiries(page, 10);

    return res.status(200).json({
      success: true,
      data: result.inquiries,
      pagination: {
        page,
        limit: 10,
        hasMore: result.hasMore,
        nextPage: result.nextPage,
      },
    });
  } catch (error) {
    console.error("getInquiries:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inquiries.",
    });
  }
};
// Guest: Submit inquiry
export const createInquiry = async (req, res) => {
  try {
    const { name, email, question } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and question are required.",
      });
    }

    const result = await gim.createInquiry({
      name: name.trim(),
      email: email.trim(),
      question: question.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("createInquiry:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit inquiry.",
    });
  }
};

// Admin: Reply to inquiry
export const replyToInquiry = async (req, res) => {
  try {
    const inquire_id = Number(req.params.inquire_id);
    const user_id = req.user?.user_id;
    const { answer } = req.body;

    if (!Number.isInteger(inquire_id) || inquire_id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID.",
      });
    }

    if (!answer?.trim()) {
      return res.status(400).json({
        success: false,
        message: "An answer is required.",
      });
    }

    const inquiry = await gim.replyToInquiry(
      inquire_id,
      answer.trim(),
      Number(user_id),
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found.",
      });
    }

    let email_sent = true;

    try {
      await sendInquiryReplyEmail({
        name: inquiry.name,
        email: inquiry.email,
        question: inquiry.question,
        answer: inquiry.answer,
      });
    } catch (emailError) {
      email_sent = false;
      console.error("Inquiry reply email error:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: email_sent
        ? "Inquiry answered and email sent successfully."
        : "Inquiry answered, but email delivery failed.",
      email_sent,
      data: inquiry,
    });
  } catch (error) {
    console.error("replyToInquiry:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reply to inquiry.",
    });
  }
};

export const markInquiryAsRead = async (req, res) => {
  try {
    const inquire_id = Number(req.params.inquire_id);

    if (!Number.isInteger(inquire_id) || inquire_id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry ID.",
      });
    }

    const result = await gim.markInquiryAsRead(inquire_id, req.user.user_id);

    return res.status(200).json({
      success: true,
      message: "Inquiry marked as read.",
    });
  } catch (error) {
    console.error("markInquiryAsRead:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark inquiry as read.",
    });
  }
};

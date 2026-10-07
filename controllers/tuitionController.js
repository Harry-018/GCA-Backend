import * as tuim from "../models/tuitionModel.js";

export const getTuition = async (req, res) => {
  try {
    const { grade_level_id } = req.params;

    const result = await tuim.getTuition(Number(grade_level_id));

    res.status(200).json({
      r: result,
      message: "Tuition retrieved successfully",
    });
  } catch (error) {
    console.error("getTuition error:", error);

    res.status(500).json({
      message: "Failed to retrieve tuition.",
    });
  }
};

export const getGradeLevel = async (req, res) => {
  try {
    const result = await tuim.getGradeLevel();

    res.status(200).json({
      r: result,
      message: "Grade levels retrieved successfully",
    });
  } catch (error) {
    console.error("getGradeLevel error:", error);

    res.status(500).json({
      message: "Failed to retrieve grade levels.",
    });
  }
};

export const createGrade = async (req, res) => {
  try {
    const result = await tuim.createGrade(req.body);

    res.status(201).json({
      r: result,
      message: "Tuition created successfully",
    });
  } catch (error) {
    console.error("createGrade error:", error);

    res.status(500).json({
      message: error.message || "Failed to create tuition.",
    });
  }
};

export const createPaymentOption = async (req, res) => {
  try {
    const result = await tuim.createPaymentOption(req.body);

    res.status(201).json({
      r: result,
      message: "Payment option created successfully",
    });
  } catch (error) {
    console.error("createPaymentOption error:", error);

    res.status(500).json({
      message: "Failed to create payment option.",
    });
  }
};

export const patchFees = async (req, res) => {
  try {
    const { fees_id } = req.params;

    const result = await tuim.patchFees(Number(fees_id), req.body);

    res.status(200).json({
      r: result,
      message: "Fees updated successfully",
    });
  } catch (error) {
    console.error("patchFees error:", error);

    res.status(500).json({
      message: "Failed to update fees.",
    });
  }
};

export const patchPaymentOption = async (req, res) => {
  try {
    const { payment_option_id } = req.params;

    const result = await tuim.patchPaymentOption(
      Number(payment_option_id),
      req.body,
    );

    res.status(200).json({
      r: result,
      message: "Payment option updated successfully",
    });
  } catch (error) {
    console.error("patchPaymentOption error:", error);

    res.status(500).json({
      message: "Failed to update payment option.",
    });
  }
};

export const patchGradePaymentOption = async (req, res) => {
  try {
    const { gradelevel_paymentoption_id } = req.params;

    const result = await tuim.patchGradePaymentOption(
      Number(gradelevel_paymentoption_id),
      req.body,
    );

    res.status(200).json({
      r: result,
      message: "Grade payment option updated successfully",
    });
  } catch (error) {
    console.error("patchGradePaymentOption error:", error);

    res.status(500).json({
      message: "Failed to update grade payment option.",
    });
  }
};

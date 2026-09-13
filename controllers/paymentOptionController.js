import * as po from "../models/paymentOptionModel.js";

export const getPaymentOptions = async (req, res) => {
  try {
    const options = await po.getPaymentOptions();

    if (options.length === 0) {
      return res
        .status(200)
        .json({ data: [], message: "No payment options available" });
    }

    res.status(200).json({ data: options });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPaymentOption = async (req, res) => {
  try {
    if (!req.body.option_name) {
      return res.status(400).json({ message: "option_name is required" });
    }

    const paymentOption = await po.createPaymentOption(req.body);

    res.status(201).json({ data: paymentOption });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editPaymentOption = async (req, res) => {
  try {
    const editOption = await po.editPaymentOption(
      req.params.payment_option_id,
      req.body,
    );
    res.status(200).json({ data: editOption });
  } catch (error) {
    if (error.message === "Payment option not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deletePaymentOption = async (req, res) => {
  try {
    const editOption = await po.deletePaymentOption(
      req.params.payment_option_id,
    );
    res.status(200).json({ data: editOption });
  } catch (error) {
    if (error.message === "Payment option not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getFeesInGradeLevels = async (req, res) => {
  try {
    const getfees = await po.getFeesInGradeLevels(req.params.grade_level_id);

    res.status(200).json({ data: getfees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentOptionsInGradeLevels = async (req, res) => {
  try {
    const getoptions = await po.getPaymentOptionsInGradeLevels(
      req.params.grade_level_id,
    );

    res.status(200).json({ data: getoptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFeesPaymentInGradeLevel = async (req, res) => {
  try {
    const {
      grade_level_id,
      amount,
      miscel_fee,
      books,
      uniform_boys,
      uniform_girls,
      pe_uniform_boys,
      pe_uniform_girls,
    } = req.body;

    if (
      !grade_level_id ||
      amount === undefined ||
      miscel_fee === undefined ||
      books === undefined ||
      uniform_boys === undefined ||
      uniform_girls === undefined ||
      pe_uniform_boys === undefined ||
      pe_uniform_girls === undefined
    ) {
      return res
        .status(400)
        .json({ message: "grade_level_id and amount are required" });
    }

    const addFees = await po.addFeesPaymentInGradeLevel(req.body);

    res.status(201).json({ data: addFees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editGradeLevelFees = async (req, res) => {
  try {
    const {
      amount,
      miscel_fee,
      books,
      uniform_boys,
      uniform_girls,
      pe_uniform_boys,
      pe_uniform_girls,
    } = req.body;

    if (
      amount === undefined ||
      miscel_fee === undefined ||
      books === undefined ||
      uniform_boys === undefined ||
      uniform_girls === undefined ||
      pe_uniform_boys === undefined ||
      pe_uniform_girls === undefined
    ) {
      return res.status(400).json({ message: "All fee fields are required" });
    }

    const updated = await po.editGradeLevelFees(
      req.params.grade_level_id,
      req.body,
    );

    res.status(200).json({ data: updated });
  } catch (error) {
    if (
      error.message === "No grade level found" ||
      error.message === "Fee record not found or nothing changed"
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteGradeLevelFees = async (req, res) => {
  try {
    const result = await po.deleteGradeLevelFees(req.params.grade_level_id);

    res
      .status(200)
      .json({ data: result, message: "Fees deleted successfully" });
  } catch (error) {
    if (
      error.message ===
      "No fee setup found for this grade level and school year"
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

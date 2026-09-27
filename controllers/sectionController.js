import * as secm from "../models/sectionModel.js";

export const getSectionGradeLevels = async (req, res) => {
  try {
    const result = await secm.getSectionGradeLevels();

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get section grade levels.",
      error: error.message,
    });
  }
};

export const getSectionsByGradeLevel = async (req, res) => {
  try {
    const { sy_grade_level_id } = req.params;

    const result = await secm.getSectionsByGradeLevel(
      Number(sy_grade_level_id),
    );

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get sections.",
      error: error.message,
    });
  }
};

export const getSectionDetails = async (req, res) => {
  try {
    const { section_id } = req.params;

    const result = await secm.getSectionDetails(Number(section_id));

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get section details.",
      error: error.message,
    });
  }
};

export const createSection = async (req, res) => {
  try {
    const result = await secm.createSection(req.body);

    res.status(201).json({
      message: "Section created successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create section.",
      error: error.message,
    });
  }
};

export const editSection = async (req, res) => {
  try {
    const { section_id } = req.params;

    const result = await secm.editSection(Number(section_id), req.body);

    res.status(200).json({
      message: "Section updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update section.",
      error: error.message,
    });
  }
};

export const updateSectionStatus = async (req, res) => {
  try {
    const { section_id } = req.params;
    const { status } = req.body;

    const result = await secm.updateSectionStatus(Number(section_id), status);

    res.status(200).json({
      message: "Section status updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update section status.",
      error: error.message,
    });
  }
};

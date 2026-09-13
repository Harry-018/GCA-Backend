import * as am from "../models/academicModel.js";

export const getSchoolYears = async (req, res) => {
  try {
    const schoolYears = await am.getSchoolYears();

    res.status(200).json({ data: schoolYears });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSchoolYearInfo = async (req, res) => {
  try {
    const schoolYearInfo = await am.getSchoolYearInfo(
      req.params.school_year_id,
    );
    res.status(200).json({ data: schoolYearInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSchoolYear = async (req, res) => {
  try {
    const schoolYear = await am.createSchoolYear(req.body);

    res
      .status(201)
      .json({ message: "Successfully Created School Year", data: schoolYear });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editSchoolYear = async (req, res) => {
  try {
    const schoolYear = await am.editSchoolYear(
      req.params.school_year_id,
      req.body,
    );

    res
      .status(201)
      .json({ message: "Successfully Edited School Year", data: schoolYear });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGradeLevels = async (req, res) => {
  try {
    const gradeLevel = await am.getGradeLevels();

    res.status(200).json({ data: gradeLevel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGradeLevelInfo = async (req, res) => {
  try {
    const gradeLevelInfo = await am.getGradeLevel(req.params.grade_level_id);
    res.status(200).json({ data: gradeLevelInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGradeLevel = async (req, res) => {
  try {
    const gradeLevel = await am.createGradeLevel(req.body);

    res
      .status(201)
      .json({ message: "Successfully Created Grade Level", data: gradeLevel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editGradeLevel = async (req, res) => {
  try {
    const gradelevel = await am.editGradeLevel(
      req.params.grade_level_id,
      req.body,
    );

    res
      .status(200)
      .json({ message: "Successfully Edited Grade Level", data: gradelevel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//gl-sy
export const getAvailableGradelevels = async (req, res) => {
  try {
    const availableGradeLevels = await am.getGradelevelsInSchoolyear();

    res.status(200).json({ data: availableGradeLevels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addGradelevelsToSchoolYears = async (req, res) => {
  try {
    const gl_sy = await am.addGradelevelsToSchoolYears(req.body);

    res.status(201).json({
      message: "Successfully added grade level to school year",
      data: gl_sy,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeGradeLevelFromSchoolYear = async (req, res) => {
  try {
    const gradelevel = await am.removeGradeLevelFromSchoolYear(req.body);

    res.status(200).json({
      message: "Successfully removed grade level from school year",
      data: gradelevel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export const changeSectionTeacher = async (req, res) => {
  try {
    const { section_id } = req.params;
    const { adviser_teacher_id } = req.body;

    if (!adviser_teacher_id) {
      return res.status(400).json({
        message: "Teacher is required.",
      });
    }

    const result = await sm.changeSectionTeacher(
      Number(section_id),
      Number(adviser_teacher_id),
    );

    res.status(200).json({
      message: "Section teacher changed successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Failed to change section teacher:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const searchStudentsForSection = async (req, res) => {
  try {
    const { section_id } = req.params;
    const { search = "" } = req.query;

    const result = await secm.searchStudentsForSection(
      Number(section_id),
      search,
    );

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to search students for section.",
      error: error.message,
    });
  }
};

export const addStudentsToSection = async (req, res) => {
  try {
    const { section_id } = req.params;
    const { student_ids } = req.body;

    const result = await secm.addStudentsToSection(
      Number(section_id),
      student_ids,
    );

    res.status(200).json({
      message: "Students added to section successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add students to section.",
      error: error.message,
    });
  }
};

export const removeStudentsFromSection = async (req, res) => {
  try {
    const { section_id } = req.params;
    const { student_ids } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        message: "Student IDs are required.",
      });
    }

    const result = await secm.removeStudentsFromSection(
      Number(section_id),
      student_ids.map(Number),
    );

    res.status(200).json({
      message: "Students removed from section.",
      data: result,
    });
  } catch (error) {
    console.error("Failed to remove students from section:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const promoteStudents = async (req, res) => {
  try {
    const { student_ids, target_sy_grade_level_id } = req.body;

    const promoted_by = req.user.user_id;

    const result = await secm.promoteStudents(
      student_ids,
      Number(target_sy_grade_level_id),
      Number(promoted_by),
    );

    res.status(200).json({
      message: "Students promoted successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to promote students.",
      error: error.message,
    });
  }
};

export const getAdviserTeachers = async (req, res) => {
  try {
    const teachers = await tm.getAdviserTeachers();

    res.status(200).json({
      data: teachers,
    });
  } catch (error) {
    console.error("Failed to get adviser teachers:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

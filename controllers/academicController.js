import * as am from "../models/academicModel.js";

export const getSchoolYears = async (req, res) => {
  try {
    const { status = "all", search = "", page = 1, limit = 10 } = req.query;

    const result = await am.getSchoolYears({
      status,
      search,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
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

//grade levels
export const getGradeLevels = async (req, res) => {
  console.log("GET GRADE LEVELS CONTROLLER REACHED");

  try {
    const gradeLevel = await am.getGradeLevels();
    console.log("GRADE LEVEL MODEL FINISHED");

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

    res.status(201).json({
      message: "Successfully Created Grade Level",
      data: gradeLevel,
    });
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

    res.status(200).json({
      message: "Successfully Edited Grade Level",
      data: gradelevel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// gl-sy

export const getGradeLevelBySchoolYearGradeLevel = async (req, res) => {
  try {
    const gradeLevel = await am.getGradeLevelBySchoolYearGradeLevel(
      req.params.sy_grade_level_id,
    );

    if (!gradeLevel) {
      return res.status(404).json({
        message: "Grade level assignment not found.",
      });
    }

    res.status(200).json({
      data: gradeLevel,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

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
    console.error("removeGradeLevelFromSchoolYear:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// subjects in grade level ==================================================================================

export const getSubjects = async (req, res) => {
  try {
    const subjects = await am.getSubjects();

    res.status(200).json({
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getSubjectsByGradeLevel = async (req, res) => {
  try {
    const subjects = await am.getSubjectsByGradeLevel(
      req.params.grade_level_id,
    );

    res.status(200).json({
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getSubjectsInGradeLevel = async (req, res) => {
  try {
    const subjects = await am.getSubjectsInGradeLevel(
      req.params.sy_grade_level_id,
    );

    res.status(200).json({ data: subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addSubjectsToGradeLevel = async (req, res) => {
  try {
    const { sy_grade_level_id } = req.body;
    const { subject_ids } = req.body;

    const result = await am.addSubjectsToGradeLevel({
      sy_grade_level_id: Number(sy_grade_level_id),
      subject_ids,
    });

    res.status(201).json({
      success: true,
      message: "Subjects assigned successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error assigning subjects:", error);

    res.status(500).json({
      success: false,
      message: "Failed to assign subjects.",
    });
  }
};

export const removeSubjectFromGradeLevel = async (req, res) => {
  try {
    const subject = await am.removeSubjectFromGradeLevel(
      req.params.sy_gradelevel_subject_id,
    );

    res.status(200).json({
      message: "Successfully removed subject from grade level",
      data: subject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// skills subject  ==================================================================================

export const getSkillsBySubject = async (req, res) => {
  try {
    const { subject_id } = req.params;

    const skills = await am.getSkillsBySubject(Number(subject_id));

    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("Error getting skills by subject:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get skills.",
    });
  }
};

// Get skills assigned to a specific grade-level subject
export const getSkillsByGradeLevelSubject = async (req, res) => {
  try {
    const { sy_gradelevel_subject_id } = req.params;

    const skills = await am.getSkillsByGradeLevelSubject(
      Number(sy_gradelevel_subject_id),
    );

    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("Error getting skills by grade-level subject:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get assigned skills.",
    });
  }
};

// Create a new master skill
export const addSkillToSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;

    const skill = await am.addSkillToSubject(Number(subject_id), req.body);

    res.status(201).json({
      success: true,
      message: "Skill added successfully.",
      data: skill,
    });
  } catch (error) {
    console.error("Error adding skill:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add skill.",
    });
  }
};

// Assign an existing skill to a grade-level subject
export const assignSkillsToGradeLevelSubject = async (req, res) => {
  try {
    const { sy_gradelevel_subject_id } = req.params;
    const { skill_ids } = req.body;
    const result = await sm.assignSkillsToGradeLevelSubject(
      Number(sy_gradelevel_subject_id),
      skill_ids,
    );
    res.status(201).json({
      success: true,
      message: "Skills assigned successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error assigning skills:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to assign skills." });
  }
};

// Edit a master skill
export const editSkill = async (req, res) => {
  try {
    const { subject_id, skill_id } = req.params;

    const result = await am.editSkill(
      Number(subject_id),
      Number(skill_id),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Skill updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error editing skill:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update skill.",
    });
  }
};

// Archive a skill assignment
export const archiveSkill = async (req, res) => {
  try {
    const { sy_gradelevel_subject_id, skill_id } = req.params;

    const result = await am.archiveSkill(
      Number(sy_gradelevel_subject_id),
      Number(skill_id),
    );

    res.status(200).json({
      success: true,
      message: "Skill archived successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error archiving skill:", error);

    res.status(500).json({
      success: false,
      message: "Failed to archive skill.",
    });
  }
};

// Restore a skill assignment
export const restoreSkill = async (req, res) => {
  try {
    const { sy_gradelevel_subject_id, skill_id } = req.params;

    const result = await am.restoreSkill(
      Number(sy_gradelevel_subject_id),
      Number(skill_id),
    );

    res.status(200).json({
      success: true,
      message: "Skill restored successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error restoring skill:", error);

    res.status(500).json({
      success: false,
      message: "Failed to restore skill.",
    });
  }
};

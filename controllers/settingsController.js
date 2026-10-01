import * as setm from "../models/settingsModel.js";

export const getGradeLevelsWithSubjectCount = async (req, res) => {
  try {
    const gradeLevels = await setm.getGradeLevelsWithSubjectCount();

    res.status(200).json(gradeLevels);
  } catch (error) {
    console.error("Error fetching grade levels:", error);

    res.status(500).json({
      message: "Failed to fetch grade levels.",
    });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await setm.getAllSubjects();

    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);

    res.status(500).json({
      message: "Failed to fetch subjects.",
    });
  }
};

export const getSubjectsByGradeLevel = async (req, res) => {
  try {
    const { gradeLevelId } = req.params;

    const subjects = await setm.getSubjectsByGradeLevel(Number(gradeLevelId));

    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects by grade level:", error);

    res.status(500).json({
      message: "Failed to fetch subjects.",
    });
  }
};

export const addSubjectToGradeLevel = async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const { subject_id } = req.body;

    if (!subject_id) {
      return res.status(400).json({
        message: "subject_id is required.",
      });
    }

    const result = await setm.addSubjectToGradeLevel({
      gradeLevelId: Number(gradeLevelId),
      subjectId: Number(subject_id),
    });

    res.status(201).json({
      message: "Subject added to grade level successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error adding subject to grade level:", error);

    res.status(400).json({
      message: error.message || "Failed to add subject to grade level.",
    });
  }
};

export const removeSubjectFromGradeLevel = async (req, res) => {
  try {
    const { syGradelevelSubjectId } = req.params;

    const result = await setm.removeSubjectFromGradeLevel(
      Number(syGradelevelSubjectId),
    );

    res.status(200).json({
      message: "Subject removed from grade level successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error removing subject from grade level:", error);

    res.status(400).json({
      message: error.message || "Failed to remove subject from grade level.",
    });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { subject_name } = req.body;

    if (!subject_name) {
      return res.status(400).json({
        message: "subject_name is required.",
      });
    }

    const subject = await setm.createSubject(subject_name);

    res.status(201).json({
      message: "Subject created successfully.",
      data: subject,
    });
  } catch (error) {
    console.error("Error creating subject:", error);

    res.status(400).json({
      message: error.message || "Failed to create subject.",
    });
  }
};

export const renameSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { subject_name } = req.body;

    if (!subject_name) {
      return res.status(400).json({
        message: "subject_name is required.",
      });
    }

    const subject = await setm.renameSubject(Number(subjectId), subject_name);

    res.status(200).json({
      message: "Subject renamed successfully.",
      data: subject,
    });
  } catch (error) {
    console.error("Error renaming subject:", error);

    res.status(400).json({
      message: error.message || "Failed to rename subject.",
    });
  }
};

export const removeSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const result = await setm.removeSubject(Number(subjectId));

    res.status(200).json({
      message: "Subject removed successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error removing subject:", error);

    res.status(400).json({
      message: error.message || "Failed to remove subject.",
    });
  }
};

export const createSkill = async (req, res) => {
  try {
    const { subject_id, skill_name, description } = req.body;

    const skill = await setm.createSkill({
      subject_id: Number(subject_id),
      skill_name,
      description,
    });

    res.status(201).json({
      message: "Skill created successfully.",
      data: skill,
    });
  } catch (error) {
    console.error("Error creating skill:", error);

    res.status(400).json({
      message: error.message || "Failed to create skill.",
    });
  }
};

export const getSkillsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const skills = await setm.getSkillsBySubject(Number(subjectId));

    res.status(200).json({
      data: skills,
    });
  } catch (error) {
    console.error("Error getting skills:", error);

    res.status(500).json({
      message: error.message || "Failed to get skills.",
    });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { skill_name, description } = req.body;

    const skill = await setm.updateSkill(Number(skillId), {
      skill_name,
      description,
    });

    res.status(200).json({
      message: "Skill updated successfully.",
      data: skill,
    });
  } catch (error) {
    console.error("Error updating skill:", error);

    res.status(400).json({
      message: error.message || "Failed to update skill.",
    });
  }
};

export const removeSkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    const result = await setm.removeSkill(Number(skillId));

    res.status(200).json({
      message: "Skill removed successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error removing skill:", error);

    res.status(400).json({
      message: error.message || "Failed to remove skill.",
    });
  }
};

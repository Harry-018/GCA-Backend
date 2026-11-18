import * as pm from "../models/parentsModel.js";

export const getParents = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const result = await pm.getParents({
      search,
      page: Number(page),
      limit: Number(limit),
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting parents:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getParentInfoByUserId = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const parent = await pm.getParentInfoByUserId(Number(user_id));

    if (!parent) {
      return res.status(404).json({
        message: "Parent information not found.",
      });
    }

    return res.status(200).json({
      r: parent,
      message: "Parent information retrieved successfully.",
    });
  } catch (error) {
    console.error("getParentInfoByUserId error:", error);

    return res.status(500).json({
      message: "Failed to retrieve parent information.",
    });
  }
};

export const editParentInfo = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { contact_number, email } = req.body;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    if (
      typeof contact_number !== "string" ||
      !contact_number.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Contact number and email are required.",
      });
    }

    const result = await pm.editParentInfo(user_id, {
      contact_number: contact_number.trim(),
      email: email.trim(),
    });

    if (Number(result.numUpdatedRows) === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent information not found or no changes were made.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Parent information updated successfully.",
    });
  } catch (error) {
    console.error("Edit Parent Info Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update parent information.",
    });
  }
};

// from here on out. not tested yet

export const getParentDashboardStudents = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const students = await pm.getParentDashboardStudents(user_id);

    return res.status(200).json({
      success: true,
      message: "Parent dashboard students retrieved successfully.",
      data: students,
    });
  } catch (error) {
    console.error("Get Parent Dashboard Students Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve parent dashboard students.",
    });
  }
};

export const getParentAnnouncements = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const announcements = await pm.getAnnouncements(user_id);

    return res.status(200).json({
      success: true,
      message: "Parent announcements retrieved successfully.",
      data: announcements,
    });
  } catch (error) {
    console.error("Get Parent Announcements Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve parent announcements.",
    });
  }
};

// Get subjects assigned to the selected student's grade level.
export const getStudentSubjects = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const stu_id = Number(req.params.stu_id);

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    if (!Number.isInteger(stu_id) || stu_id <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid student ID is required.",
      });
    }

    const subjects = await pm.getStudentSubjects(user_id, stu_id);

    if (subjects === null) {
      return res.status(404).json({
        success: false,
        message: "Student not found or has no active enrollment.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student subjects retrieved successfully.",
      data: subjects,
    });
  } catch (error) {
    console.error("Get Student Subjects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student subjects.",
    });
  }
};

// Get grades for the selected student, subject, and quarter.
export const getStudentSubjectGrades = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const stu_id = Number(req.params.stu_id);
    const subject_id = Number(req.params.subject_id);
    const quarter_id = Number(req.query.quarter_id);

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    if (
      !Number.isInteger(stu_id) ||
      stu_id <= 0 ||
      !Number.isInteger(subject_id) ||
      subject_id <= 0 ||
      !Number.isInteger(quarter_id) ||
      quarter_id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid student, subject, and quarter IDs are required.",
      });
    }

    const result = await pm.getStudentSubjectGrades(
      user_id,
      stu_id,
      subject_id,
      quarter_id,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Student, subject, or quarter not found, or no assigned skills are available.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student subject grades retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Get Student Subject Grades Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student subject grades.",
    });
  }
};

// Get the overall teacher remark for the selected student and quarter.
export const getStudentTeacherRemarks = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const stu_id = Number(req.params.stu_id);
    const quarter_id = Number(req.query.quarter_id);

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    if (
      !Number.isInteger(stu_id) ||
      stu_id <= 0 ||
      !Number.isInteger(quarter_id) ||
      quarter_id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid student ID and quarter ID are required.",
      });
    }

    const result = await pm.getStudentTeacherRemarks(
      user_id,
      stu_id,
      quarter_id,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Student not found or has no active enrollment.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student teacher remarks retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Get Student Teacher Remarks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student teacher remarks.",
    });
  }
};

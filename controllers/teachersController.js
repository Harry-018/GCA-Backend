import * as tm from "../models/teachersModel.js";

export const getTeachers = async (req, res) => {
  try {
    const { status = "all", search = "", page = 1, limit = 10 } = req.query;

    const result = await tm.getTeachers({
      status,
      search,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting teachers:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getTeacherInfo = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    const teacher = await tm.getTeacherInfo(Number(teacher_id));

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      data: teacher,
    });
  } catch (error) {
    console.error("Error getting teacher:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    const teacher = await tm.updateTeacher(Number(teacher_id), req.body);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

//ACCOUNT SETTINGS

// TEACHER PORTAL INFORMATION
//get teacher info by account id(user_id)
export const getTeacherInfoByUserId = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const teacher = await tm.getTeacherInfoByUserId(Number(user_id));

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher information not found.",
      });
    }

    return res.status(200).json({
      r: teacher,
      message: "Teacher information retrieved successfully.",
    });
  } catch (error) {
    console.error("getTeacherInfoByUserId error:", error);

    return res.status(500).json({
      message: "Failed to retrieve teacher information.",
    });
  }
};

export const editTeacherInfo = async (req, res) => {
  try {
    const user_id = Number(req.user?.user_id);

    if (!Number.isInteger(user_id) || user_id <= 0) {
      return res.status(401).json({
        message: "Invalid authenticated user.",
      });
    }

    const { contact_num, email } = req.body;

    if (
      contact_num === undefined ||
      email === undefined ||
      !String(contact_num).trim() ||
      !String(email).trim()
    ) {
      return res.status(400).json({
        message: "Contact number and email are required.",
      });
    }

    const result = await tm.editTeacherInfo({
      user_id,
      contact_num: String(contact_num).trim(),
      email: String(email).trim(),
    });

    return res.status(200).json({
      data: result,
      message: "Teacher information updated successfully.",
    });
  } catch (error) {
    console.error("editTeacherInfo error:", error);

    if (error.message === "Teacher not found for user.") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update teacher information.",
    });
  }
};

export const getTeacherSchedules = async (req, res) => {
  try {
    const user_id = Number(req.user?.user_id);

    if (!Number.isInteger(user_id) || user_id <= 0) {
      return res.status(401).json({
        message: "Invalid authe nticated user.",
      });
    }

    const schedules = await tm.getTeacherSchedules(user_id);

    return res.status(200).json({
      data: schedules,
      message: "Teacher schedules retrieved successfully.",
    });
  } catch (error) {
    console.error("getTeacherSchedules error:", error);

    return res.status(500).json({
      message: "Failed to retrieve teacher schedules.",
    });
  }
};

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

export const getAssignedSections = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await tm.getAssignedSectionForTeacher(user_id);

    res.status(200).json({
      success: true,
      message: "Assigned sections retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("getAssignedSections error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve assigned sections.",
    });
  }
};

export const getAttendanceStudents = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { section_id, date } = req.query;

    if (!section_id || !date) {
      return res.status(400).json({
        success: false,
        message: "Section ID and attendance date are required.",
      });
    }

    const result = await tm.getAttendanceStudents(
      user_id,
      Number(section_id),
      date,
    );

    res.status(200).json({
      success: true,
      message: "Attendance students retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("getAttendanceStudents error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve attendance students.",
    });
  }
};

export const saveAttendance = async (req, res) => {
  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  };

  try {
    const user_id = req.user.user_id;
    const { section_id, date, attendance } = req.body;

    if (!section_id || !date || !Array.isArray(attendance)) {
      return res.status(400).json({
        success: false,
        message:
          "Section ID, attendance date, and attendance records are required.",
      });
    }

    const parsedSectionId = Number(section_id);

    if (!Number.isInteger(parsedSectionId) || parsedSectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID.",
      });
    }

    if (attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No attendance records were provided.",
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date. Use YYYY-MM-DD.",
      });
    }

    const validStatuses = ["present", "absent"];

    const invalidRecord = attendance.some(
      (record) =>
        !record ||
        typeof record !== "object" ||
        !Number.isInteger(Number(record.enrollment_id)) ||
        Number(record.enrollment_id) <= 0 ||
        !validStatuses.includes(record.attendance_status),
    );

    if (invalidRecord) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance records contain invalid enrollment IDs or statuses.",
      });
    }

    const result = await tm.saveAttendance(
      user_id,
      parsedSectionId,
      date,
      attendance,
    );

    res.status(200).json({
      success: true,
      message: "Attendance saved successfully",
      result: JSON.parse(
        JSON.stringify(result, (key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      ),
    });
  } catch (error) {
    console.error("saveAttendance error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to save attendance.",
    });
  }
};

export const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { section_id, month, year } = req.query;

    const sectionId = Number(section_id);
    const reportMonth = Number(month);
    const reportYear = Number(year);

    if (!Number.isInteger(sectionId) || sectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid section_id is required.",
      });
    }

    if (!Number.isInteger(reportMonth) || reportMonth < 1 || reportMonth > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12.",
      });
    }

    if (
      !Number.isInteger(reportYear) ||
      reportYear < 2000 ||
      reportYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid year is required.",
      });
    }

    const report = await tm.getMonthlyAttendanceReport(
      req.user.user_id,
      sectionId,
      reportMonth,
      reportYear,
    );

    return res.status(200).json({
      success: true,
      message: "Monthly attendance report retrieved successfully.",
      data: report,
    });
  } catch (error) {
    console.error("getMonthlyAttendanceReport error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve attendance report.",
    });
  }
};

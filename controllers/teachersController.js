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

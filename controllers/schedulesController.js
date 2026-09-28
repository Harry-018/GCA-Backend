import * as schedm from "../models/schedulesModel.js";
/* * GET /api/schedules/grade-levels */ export const getScheduleGradeLevels =
  async (req, res) => {
    try {
      const gradeLevels = await schedm.getScheduleGradeLevels();
      res.status(200).json({ data: gradeLevels });
    } catch (error) {
      console.error("Failed to get schedule grade levels:", error);
      res.status(500).json({
        message: "Failed to get schedule grade levels.",
        error: error.message,
      });
    }
  };
/* * GET /api/schedules/grade-levels/:sy_grade_level_id/sections */ export const getScheduleSections =
  async (req, res) => {
    try {
      const { sy_grade_level_id } = req.params;
      const id = Number(sy_grade_level_id);
      if (!Number.isInteger(id) || id <= 0) {
        return res
          .status(400)
          .json({ message: "Invalid school-year grade level ID." });
      }
      const sections = await schedm.getScheduleSections(id);
      res.status(200).json({ data: sections });
    } catch (error) {
      console.error("Failed to get schedule sections:", error);
      res.status(500).json({
        message: "Failed to get schedule sections.",
        error: error.message,
      });
    }
  };
/* * GET /api/schedules/sections/:section_id */ export const getSectionSchedules =
  async (req, res) => {
    try {
      const { section_id } = req.params;
      const id = Number(section_id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid section ID." });
      }
      const schedules = await schedm.getSectionSchedules(id);
      res.status(200).json({ data: schedules });
    } catch (error) {
      console.error("Failed to get section schedules:", error);
      res.status(500).json({
        message: "Failed to get section schedules.",
        error: error.message,
      });
    }
  };
/* * GET /api/schedules/sections/:section_id/subjects */ export const getScheduleSubjects =
  async (req, res) => {
    try {
      const { section_id } = req.params;
      const id = Number(section_id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid section ID." });
      }
      const subjects = await schedm.getScheduleSubjects(id);
      res.status(200).json({ data: subjects });
    } catch (error) {
      console.error("Failed to get schedule subjects:", error);
      res.status(500).json({
        message: "Failed to get schedule subjects.",
        error: error.message,
      });
    }
  };
/* * GET /api/schedules/teachers */ export const getScheduleTeachers = async (
  req,
  res,
) => {
  try {
    const teachers = await schedm.getScheduleTeachers();
    res.status(200).json({ data: teachers });
  } catch (error) {
    console.error("Failed to get schedule teachers:", error);
    res.status(500).json({
      message: "Failed to get schedule teachers.",
      error: error.message,
    });
  }
};
/* * GET /api/schedules/rooms */ export const getScheduleRooms = async (
  req,
  res,
) => {
  try {
    const rooms = await schedm.getScheduleRooms();
    res.status(200).json({ data: rooms });
  } catch (error) {
    console.error("Failed to get schedule rooms:", error);
    res
      .status(500)
      .json({ message: "Failed to get schedule rooms.", error: error.message });
  }
};
/* * GET /api/schedules/days */ export const getScheduleDays = async (
  req,
  res,
) => {
  try {
    const days = await schedm.getScheduleDays();
    res.status(200).json({ data: days });
  } catch (error) {
    console.error("Failed to get schedule days:", error);
    res
      .status(500)
      .json({ message: "Failed to get schedule days.", error: error.message });
  }
};
/* * GET /api/schedules/times */ export const getScheduleTimes = async (
  req,
  res,
) => {
  try {
    const times = await schedm.getScheduleTimes();
    res.status(200).json({ data: times });
  } catch (error) {
    console.error("Failed to get schedule times:", error);
    res
      .status(500)
      .json({ message: "Failed to get schedule times.", error: error.message });
  }
};
/* * POST /api/schedules */ export const createSchedule = async (req, res) => {
  try {
    const {
      section_id,
      sched_time_id,
      room_id,
      teacher_id,
      subject_id,
      day_id,
    } = req.body;
    if (
      !section_id ||
      !sched_time_id ||
      !room_id ||
      !teacher_id ||
      !subject_id ||
      !day_id
    ) {
      return res
        .status(400)
        .json({ message: "All schedule fields are required." });
    }
    const result = await schedm.createSchedule({
      section_id: Number(section_id),
      sched_time_id: Number(sched_time_id),
      room_id: Number(room_id),
      teacher_id: Number(teacher_id),
      subject_id: Number(subject_id),
      day_id: Number(day_id),
    });
    res
      .status(201)
      .json({ message: "Schedule created successfully.", data: result });
  } catch (error) {
    console.error("Failed to create schedule:", error);
    res
      .status(500)
      .json({ message: "Failed to create schedule.", error: error.message });
  }
};
/* * PUT /api/schedules/:schedule_id */ export const editSchedule = async (
  req,
  res,
) => {
  try {
    const { schedule_id } = req.params;
    const id = Number(schedule_id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid schedule ID." });
    }
    const {
      section_id,
      sched_time_id,
      room_id,
      teacher_id,
      subject_id,
      day_id,
    } = req.body;
    if (
      !section_id ||
      !sched_time_id ||
      !room_id ||
      !teacher_id ||
      !subject_id ||
      !day_id
    ) {
      return res
        .status(400)
        .json({ message: "All schedule fields are required." });
    }
    const result = await schedm.editSchedule(id, {
      section_id: Number(section_id),
      sched_time_id: Number(sched_time_id),
      room_id: Number(room_id),
      teacher_id: Number(teacher_id),
      subject_id: Number(subject_id),
      day_id: Number(day_id),
    });
    res
      .status(200)
      .json({ message: "Schedule updated successfully.", data: result });
  } catch (error) {
    console.error("Failed to edit schedule:", error);
    res
      .status(500)
      .json({ message: "Failed to edit schedule.", error: error.message });
  }
};
/* * DELETE /api/schedules/:schedule_id */ export const deleteSchedule = async (
  req,
  res,
) => {
  try {
    const { schedule_id } = req.params;
    const id = Number(schedule_id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid schedule ID." });
    }
    const result = await schedm.deleteSchedule(id);
    res
      .status(200)
      .json({ message: "Schedule deleted successfully.", data: result });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    res
      .status(500)
      .json({ message: "Failed to delete schedule.", error: error.message });
  }
};

import * as schedm from "../models/schedulesModel.js";

export const getScheduleGradeLevels = async (req, res) => {
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

export const getScheduleSections = async (req, res) => {
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

export const getScheduleSubjects = async (req, res) => {
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

export const getScheduleRooms = async (req, res) => {
  try {
    const rooms = await schedm.getScheduleRooms();
    res.status(200).json({ data: rooms });
  } catch (error) {
    console.error("Failed to get rooms:", error);
    res
      .status(500)
      .json({ message: "Failed to get rooms.", error: error.message });
  }
};

export const getScheduleDays = async (req, res) => {
  try {
    const days = await schedm.getScheduleDays();
    res.status(200).json({ data: days });
  } catch (error) {
    console.error("Failed to get week days:", error);
    res
      .status(500)
      .json({ message: "Failed to get week days.", error: error.message });
  }
};

export const getScheduleTimes = async (req, res) => {
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

export const getSchedulesBySection = async (req, res) => {
  try {
    const { section_id } = req.params;
    const id = Number(section_id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid section ID." });
    }
    const schedules = await schedm.getSchedulesBySection(id);
    res.status(200).json({ data: schedules });
  } catch (error) {
    console.error("Failed to get section schedules:", error);
    res.status(500).json({
      message: "Failed to get section schedules.",
      error: error.message,
    });
  }
};

export const createSchedule = async (req, res) => {
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

export const updateSchedule = async (req, res) => {
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
    const result = await schedm.updateSchedule(id, {
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
    console.error("Failed to update schedule:", error);
    res
      .status(500)
      .json({ message: "Failed to update schedule.", error: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
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

import * as comm from "../models/communicationModel.js";

export const getGradeLevelWithAnnouncementCount = async (req, res) => {
  try {
    const result = await comm.getGradeLevelWithAnnouncementCount();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting grade levels:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAnnouncementsByGradeLevel = async (req, res) => {
  try {
    const { sy_grade_level_id } = req.params;

    const result = await comm.getAnnouncementsByGradeLevel(
      Number(sy_grade_level_id),
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting announcements:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const createAnnouncementInGradeLevel = async (req, res) => {
  try {
    const { sy_grade_level_id } = req.params;

    const { title, event_date, start_time, end_time, venue, body } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Announcement title is required.",
      });
    }

    if (!event_date) {
      return res.status(400).json({
        message: "Event date is required.",
      });
    }

    if (!start_time) {
      return res.status(400).json({
        message: "Start time is required.",
      });
    }

    if (!end_time) {
      return res.status(400).json({
        message: "End time is required.",
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({
        message: "End time must be later than start time.",
      });
    }

    if (!venue?.trim()) {
      return res.status(400).json({
        message: "Venue is required.",
      });
    }

    if (!body?.trim()) {
      return res.status(400).json({
        message: "Announcement description is required.",
      });
    }

    const result = await comm.createAnnouncementInGradeLevel(
      Number(sy_grade_level_id),
      {
        title,
        event_date,
        start_time,
        end_time,
        venue,
        body,
      },
      req.user.user_id,
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating announcement:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const editAnnouncementInGradeLevel = async (req, res) => {
  try {
    const { announcement_id } = req.params;

    const { title, event_date, start_time, end_time, venue, body } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Announcement title is required.",
      });
    }

    if (!event_date) {
      return res.status(400).json({
        message: "Event date is required.",
      });
    }

    if (!start_time) {
      return res.status(400).json({
        message: "Start time is required.",
      });
    }

    if (!end_time) {
      return res.status(400).json({
        message: "End time is required.",
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({
        message: "End time must be later than start time.",
      });
    }

    if (!venue?.trim()) {
      return res.status(400).json({
        message: "Venue is required.",
      });
    }

    if (!body?.trim()) {
      return res.status(400).json({
        message: "Announcement description is required.",
      });
    }

    const result = await comm.editAnnouncementInGradeLevel(
      Number(announcement_id),
      {
        title,
        event_date,
        start_time,
        end_time,
        venue,
        body,
      },
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error editing announcement:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteAnnouncementInGradeLevel = async (req, res) => {
  try {
    const { announcement_id } = req.params;

    const result = await comm.deleteAnnouncementInGradeLevel(
      Number(announcement_id),
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting announcement:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

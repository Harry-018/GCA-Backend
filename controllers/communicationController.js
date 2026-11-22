import { sendTuitionReminder } from "../emails/emailService.js";
import * as comm from "../models/communicationModel.js";

// =====================
// ANNOUNCEMENTS
// =====================

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

// =====================
// NOTIFICATIONS
// =====================

export const getPaymentOptions = async (req, res) => {
  try {
    const paymentOptions = await comm.getPaymentOptions();

    res.status(200).json(paymentOptions);
  } catch (error) {
    console.error("Get payment options error:", error);

    res.status(500).json({
      message: "Failed to get payment options.",
    });
  }
};

export const getNotificationTemplates = async (req, res) => {
  try {
    const templates = await comm.getNotificationTemplates();

    res.status(200).json(templates);
  } catch (error) {
    console.error("Get notification templates error:", error);

    res.status(500).json({
      message: "Failed to get notification templates.",
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await comm.getNotifications();

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      message: "Failed to get notifications.",
    });
  }
};

export const sendNotification = async (req, res) => {
  try {
    const { template_id, audience, payment_option_id } = req.body;

    if (!template_id) {
      return res.status(400).json({
        message: "Notification template is required.",
      });
    }

    if (!audience) {
      return res.status(400).json({
        message: "Notification audience is required.",
      });
    }

    if (!payment_option_id) {
      return res.status(400).json({
        message: "Payment option is required.",
      });
    }

    const template = await comm.getNotificationTemplateById(
      Number(template_id),
    );

    if (!template) {
      return res.status(404).json({
        message: "Notification template not found.",
      });
    }

    const recipients = await comm.getNotificationRecipients({
      audience,
      payment_option_id: Number(payment_option_id),
    });

    if (recipients.length === 0) {
      return res.status(404).json({
        message: "No eligible recipients found.",
      });
    }

    const uniqueRecipients = Array.from(
      new Map(
        recipients.map((recipient) => [
          recipient.email.toLowerCase().trim(),
          recipient,
        ]),
      ).values(),
    );

    let sentCount = 0;

    for (const recipient of uniqueRecipients) {
      await sendTuitionReminder({
        email: recipient.email,
        parentName: `${recipient.first_name} ${recipient.last_name}`,
        templateSubject: template.subject,
        templateBody: template.body,
      });

      sentCount++;
    }

    await comm.createNotification({
      template_id: template.template_id,
      audience,
      created_by: req.user.user_id,
      sent_at: new Date(),
      payment_option_id: Number(payment_option_id),
    });

    res.status(200).json({
      message: "Notification sent successfully.",
      sentCount,
    });
  } catch (error) {
    console.error("Send notification error:", error);

    res.status(500).json({
      message: error.message || "Failed to send notification.",
    });
  }
};

// =====================
// ERROR HANDLER
// =====================

const handleError = (res, error, defaultMessage) => {
  console.error(defaultMessage, error);

  const message = error.message || defaultMessage;

  if (message.includes("not found") || message.includes("does not exist")) {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  if (
    message.includes("already exists") ||
    message.includes("Duplicate entry")
  ) {
    return res.status(409).json({
      success: false,
      message,
    });
  }

  return res.status(400).json({
    success: false,
    message,
  });
};

// =====================
// GET NOTIFICATION AUDIENCES
// GET /api/notifications/audiences
// =====================

export const getNotificationAudiences = async (req, res) => {
  try {
    const result = await comm.getNotificationAudiences();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to retrieve notification audiences.",
    );
  }
};

// =====================
// GET NOTIFICATION RECIPIENTS
// GET /api/notifications/recipients
// =====================

export const getNotificationRecipients = async (req, res) => {
  try {
    const { audience, payment_option_id } = req.query;

    if (!audience) {
      return res.status(400).json({
        success: false,
        message: "Notification audience is required.",
      });
    }

    if (audience === "parent" && !payment_option_id) {
      return res.status(400).json({
        success: false,
        message: "Payment option is required for parent recipients.",
      });
    }

    const result = await comm.getNotificationRecipients({
      audience,
      payment_option_id,
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to retrieve notification recipients.",
    );
  }
};

// =====================
// GET ALL TUITION REMINDERS
// GET /api/notifications/tuition-reminders
// =====================

export const getTuitionReminders = async (req, res) => {
  try {
    const result = await comm.getTuitionReminders();

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to retrieve tuition reminders.");
  }
};

// =====================
// GET TUITION REMINDER BY ID
// GET /api/notifications/tuition-reminders/:reminder_id
// =====================

export const getTuitionReminderById = async (req, res) => {
  try {
    const { reminder_id } = req.params;

    const result = await comm.getTuitionReminderById(reminder_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Tuition reminder not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to retrieve tuition reminder.");
  }
};

// =====================
// CREATE TUITION REMINDER
// POST /api/notifications/tuition-reminders
// =====================

export const createTuitionReminder = async (req, res) => {
  try {
    const result = await comm.createTuitionReminder(req.body, req.user.user_id);

    return res.status(201).json({
      success: true,
      message: "Tuition reminder created successfully.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to create tuition reminder.");
  }
};

// =====================
// UPDATE TUITION REMINDER
// PUT /api/notifications/tuition-reminders/:reminder_id
// =====================

export const updateTuitionReminder = async (req, res) => {
  try {
    const { reminder_id } = req.params;

    const result = await comm.updateTuitionReminder(reminder_id, req.body);

    return res.status(200).json({
      success: true,
      message: "Tuition reminder updated successfully.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to update tuition reminder.");
  }
};

// =====================
// DELETE TUITION REMINDER
// DELETE /api/notifications/tuition-reminders/:reminder_id
// =====================

export const deleteTuitionReminder = async (req, res) => {
  try {
    const { reminder_id } = req.params;

    const result = await comm.deleteTuitionReminder(reminder_id);

    return res.status(200).json({
      success: true,
      message: "Tuition reminder deleted successfully.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to delete tuition reminder.");
  }
};

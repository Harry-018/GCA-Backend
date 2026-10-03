import { sendTuitionReminder } from "../emails/emailService.js";
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

// ================
// notifications
// ================
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

export const sendTuitionReminderNotification = async (req, res) => {
  try {
    const { payment_option_id } = req.body;

    if (!payment_option_id) {
      return res.status(400).json({
        message: "Payment option is required.",
      });
    }

    const recipients = await comm.getTuitionReminderRecipients(
      Number(payment_option_id),
    );

    if (recipients.length === 0) {
      return res.status(404).json({
        message: "No eligible parents found for this payment option.",
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

    const template =
      await comm.getNotificationTemplateByPurpose("Tuition Reminder");

    if (!template) {
      return res.status(500).json({
        message: "Tuition Reminder notification template not found.",
      });
    }

    let sentCount = 0;

    for (const recipient of uniqueRecipients) {
      await sendTuitionReminder({
        email: recipient.email,
        parentName: `${recipient.first_name} ${recipient.last_name}`,
        paymentOption: recipient.option_name,
        templateSubject: template.subject,
        templateBody: template.body,
      });
      sentCount++;
    }

    await comm.createNotification({
      template_id: template.template_id,
      audience: "parent",
      created_by: req.user.user_id,
      sent_at: new Date(),
      payment_option_id: Number(payment_option_id),
    });

    res.status(200).json({
      message: "Tuition reminders sent successfully.",
      sentCount,
    });
  } catch (error) {
    console.error("Send tuition reminder error:", error);

    res.status(500).json({
      message: "Failed to send tuition reminders.",
    });
  }
};

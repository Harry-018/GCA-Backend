import db from "../config/db.js";
import { sql } from "kysely";
import { logAdminActivity } from "./activityLogsModel.js";

// =====================
// GRADE LEVELS
// WITH ANNOUNCEMENT COUNT
// =====================

export const getGradeLevelWithAnnouncementCount = async () => {
  return await db
    .selectFrom("schoolyears_gradelevels as sgl")
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .leftJoin(
      "announcements as an",
      "sgl.sy_grade_level_id",
      "an.sy_grade_level_id",
    )
    .select([
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sgl.sy_grade_level_id",
    ])
    .select(({ fn }) => [
      fn.count("an.announcement_id").as("announcement_count"),
    ])
    .where("sy.sy_status", "=", "active")
    .where("sgl.sy_gradelevel_status", "=", "active")
    .groupBy([
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sgl.sy_grade_level_id",
    ])
    .orderBy("gl.grade_level_id", "asc")
    .execute();
};

// =====================
// GET ANNOUNCEMENTS
// =====================

export const getAnnouncementsByGradeLevel = async (sy_grade_level_id) => {
  return await db
    .selectFrom("announcements as an")
    .innerJoin("user_accounts as ua", "an.user_id", "ua.user_id")
    .select([
      "an.announcement_id",
      "an.title",
      "an.event_date",
      "an.start_time",
      "an.end_time",
      "an.venue",
      "an.body",
      "an.posted_at",
      "ua.first_name",
      "ua.last_name",
    ])
    .where("an.sy_grade_level_id", "=", sy_grade_level_id)
    .orderBy("an.posted_at", "desc")
    .execute();
};

// =====================
// CREATE ANNOUNCEMENT
// =====================

export const createAnnouncementInGradeLevel = async (
  sy_grade_level_id,
  data,
  user_id,
) => {
  const gradeLevel = await db
    .selectFrom("schoolyears_gradelevels")
    .select("sy_grade_level_id")
    .where("sy_grade_level_id", "=", sy_grade_level_id)
    .where("sy_gradelevel_status", "=", "active")
    .executeTakeFirst();

  if (!gradeLevel) {
    throw new Error("Grade level is not found or is not active.");
  }

  const user = await db
    .selectFrom("user_accounts")
    .select("user_id")
    .where("user_id", "=", user_id)
    .where("role", "=", "admin")
    .where("account_status", "=", "active")
    .executeTakeFirst();

  if (!user) {
    throw new Error("Active admin account not found.");
  }

  const result = await db
    .insertInto("announcements")
    .values({
      title: data.title.trim(),
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      venue: data.venue.trim(),
      body: data.body.trim(),
      posted_at: new Date(),
      sy_grade_level_id: Number(sy_grade_level_id),
      user_id: Number(user_id),
    })
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Created",
    user_module: "Announcements",
    description: `Created announcement "${data.title.trim()}".`,
  });

  return {
    announcement_id: Number(result.insertId),
    title: data.title.trim(),
    event_date: data.event_date,
    start_time: data.start_time,
    end_time: data.end_time,
    venue: data.venue.trim(),
    body: data.body.trim(),
    sy_grade_level_id: Number(sy_grade_level_id),
    user_id: Number(user_id),
  };
};

// =====================
// EDIT ANNOUNCEMENT
// =====================

export const editAnnouncementInGradeLevel = async (
  announcement_id,
  data,
  user_id,
) => {
  const existing = await db
    .selectFrom("announcements")
    .select("announcement_id")
    .where("announcement_id", "=", announcement_id)
    .executeTakeFirst();

  if (!existing) {
    throw new Error("Announcement not found.");
  }

  await db
    .updateTable("announcements")
    .set({
      title: data.title.trim(),
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      venue: data.venue.trim(),
      body: data.body.trim(),
    })
    .where("announcement_id", "=", announcement_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Announcements",
    description: `Updated announcement "${data.title.trim()}".`,
  });

  return {
    announcement_id: Number(announcement_id),
    title: data.title.trim(),
    event_date: data.event_date,
    start_time: data.start_time,
    end_time: data.end_time,
    venue: data.venue.trim(),
    body: data.body.trim(),
  };
};

// =====================
// DELETE ANNOUNCEMENT
// =====================

export const deleteAnnouncementInGradeLevel = async (
  announcement_id,
  user_id,
) => {
  const existing = await db
    .selectFrom("announcements")
    .select(["announcement_id", "title"])
    .where("announcement_id", "=", announcement_id)
    .executeTakeFirst();

  if (!existing) {
    throw new Error("Announcement not found.");
  }

  await db
    .deleteFrom("announcements")
    .where("announcement_id", "=", announcement_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Deleted",
    user_module: "Announcements",
    description: `Deleted announcement "${existing.title}".`,
  });

  return {
    announcement_id: Number(announcement_id),
  };
};

// =====================
// NOTIFICATIONS
// =====================

export const getPaymentOptions = async () => {
  return await db
    .selectFrom("payment_option")
    .select(["payment_option_id", "option_name"])
    .orderBy("payment_option_id", "asc")
    .execute();
};

export const getNotifications = async () => {
  return await db
    .selectFrom("notifications as n")
    .innerJoin("notification_template as nt", "n.template_id", "nt.template_id")
    .innerJoin("user_accounts as ua", "n.created_by", "ua.user_id")
    .leftJoin(
      "payment_option as po",
      "n.payment_option_id",
      "po.payment_option_id",
    )
    .select([
      "n.notification_id",
      "nt.purpose_name",
      "nt.subject",
      "n.audience",
      "n.sent_at",
      "po.option_name as payment_option",
      "ua.first_name as created_by_first_name",
      "ua.last_name as created_by_last_name",
    ])
    .orderBy("n.sent_at", "desc")
    .execute();
};

export const createNotification = async ({
  template_id,
  audience,
  created_by,
  sent_at,
  payment_option_id,
}) => {
  const result = await db
    .insertInto("notifications")
    .values({
      template_id,
      audience,
      created_by,
      sent_at,
      payment_option_id,
    })
    .executeTakeFirst();

  await logAdminActivity({
    user_id: created_by,
    user_action: "Created",
    user_module: "Notifications",
    description: `Created notification for ${audience} audience.`,
  });

  return result;
};

export const getNotificationTemplateById = async (template_id) => {
  return await db
    .selectFrom("notification_template")
    .select(["template_id", "purpose_name", "subject", "body"])
    .where("template_id", "=", template_id)
    .executeTakeFirst();
};

export const getNotificationTemplates = async () => {
  return await db
    .selectFrom("notification_template")
    .select(["template_id", "purpose_name", "subject"])
    .orderBy("template_id", "asc")
    .execute();
};

// =====================
// PARENT RECIPIENTS
// =====================

export const getTuitionReminderRecipients = async (payment_option_id) => {
  return await db
    .selectFrom("students as s")
    .innerJoin("enrollment as e", "s.stu_id", "e.stu_id")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "e.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("submissions as sub", "s.submission_id", "sub.submission_id")
    .innerJoin(
      "app_approval as aa",
      "sub.app_approval_id",
      "aa.app_approval_id",
    )
    .innerJoin("applications as a", "aa.application_id", "a.application_id")
    .innerJoin(
      "gradelevel_paymentoptions as glpo",
      "a.gradelevel_paymentoption_id",
      "glpo.gradelevel_paymentoption_id",
    )
    .innerJoin(
      "payment_option as po",
      "glpo.payment_option_id",
      "po.payment_option_id",
    )
    .innerJoin(
      "applicant_parent as ap",
      "a.application_id",
      "ap.application_id",
    )
    .innerJoin("parent_info as pi", "ap.parent_info_id", "pi.parent_info_id")
    .select([
      "pi.parent_info_id",
      "pi.first_name",
      "pi.last_name",
      "ua.email",
      "s.stu_id",
      "s.stu_num",
      "po.payment_option_id",
      "po.option_name",
    ])
    .innerJoin("user_accounts as ua", "pi.user_id", "ua.user_id")

    .where("sy.sy_status", "=", "active")
    .where("sgl.sy_gradelevel_status", "=", "active")
    .where("e.enr_status", "=", "enrolled")
    .where("s.stu_status", "=", "active")
    .where("sub.sub_status", "=", "confirmed")
    .where("aa.approval_status", "=", "approved")
    .where("a.application_status", "=", "approved")
    .where("ap.will_receive_account", "=", 1)
    .where("po.payment_option_id", "=", Number(payment_option_id))
    .orderBy("pi.last_name", "asc")
    .where("ua.role", "=", "parent")
    .where("ua.account_status", "=", "active")
    .where("ua.email", "is not", null)
    .where("ua.email", "!=", "")
    .execute();
};

// =====================
// TEACHER RECIPIENTS
// =====================

export const getTeacherNotificationRecipients = async () => {
  return await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("user_accounts as ua", "ti.user_id", "ua.user_id")
    .select([
      "ti.teacher_info_id",
      "ti.first_name",
      "ti.last_name",
      "ua.email",
      "t.teacher_id",
      "t.teacher_num",
    ])
    .where("t.teacher_status", "=", "active")
    .where("ua.role", "=", "teacher")
    .where("ua.account_status", "=", "active")
    .where("ua.email", "is not", null)
    .where("ua.email", "!=", "")
    .orderBy("ti.last_name", "asc")
    .execute();
};

// =====================
// GET NOTIFICATION RECIPIENTS
// =====================

export const getNotificationRecipients = async ({
  audience,
  payment_option_id,
}) => {
  switch (audience) {
    case "parent":
      return await getTuitionReminderRecipients(payment_option_id);

    case "teacher":
      return await getTeacherNotificationRecipients();

    default:
      throw new Error(`Unsupported notification audience: ${audience}`);
  }
};

// =====================
// GET NOTIFICATION AUDIENCES
// =====================

export const getNotificationAudiences = async () => {
  const result = await sql`
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notifications'
      AND COLUMN_NAME = 'audience'
  `.execute(db);

  const columnType = result.rows[0]?.COLUMN_TYPE;

  if (!columnType) {
    return [];
  }

  const values = columnType
    .replace(/^enum\(/i, "")
    .replace(/\)$/i, "")
    .split(",")
    .map((value) => value.replace(/^'|'$/g, "").trim());

  return values.map((value) => ({
    value,
    label: `${value.charAt(0).toUpperCase()}${value.slice(1)}s`,
  }));
};

// =====================
// TUITION REMINDER CRUD
// =====================

const validateTuitionReminder = ({
  payment_option_id,
  due_month,
  due_day,
  days_before,
}) => {
  const month = Number(due_month);
  const day = Number(due_day);
  const offset = Number(days_before);
  const paymentOptionId = Number(payment_option_id);

  if (!Number.isInteger(paymentOptionId) || paymentOptionId < 1) {
    throw new Error("Invalid payment option.");
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid due month.");
  }

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error("Invalid due day.");
  }

  if (!Number.isInteger(offset) || offset < 0 || offset > 65535) {
    throw new Error("Invalid reminder offset.");
  }

  // Use leap year 2024 so February 29 is allowed.
  const maxDay = new Date(Date.UTC(2024, month, 0)).getUTCDate();

  if (day > maxDay) {
    throw new Error("Invalid day for the selected month.");
  }

  return {
    payment_option_id: paymentOptionId,
    due_month: month,
    due_day: day,
    days_before: offset,
  };
};

// GET ALL REMINDERS
export const getTuitionReminders = async () => {
  return await db
    .selectFrom("tuition_reminders as tr")
    .innerJoin(
      "payment_option as po",
      "tr.payment_option_id",
      "po.payment_option_id",
    )
    .select([
      "tr.reminder_id",
      "tr.payment_option_id",
      "po.option_name",
      "tr.due_month",
      "tr.due_day",
      "tr.days_before",
      "tr.is_active",
      "tr.created_at",
      "tr.updated_at",
    ])
    .where("tr.is_active", "=", 1)
    .orderBy("tr.payment_option_id", "asc")
    .orderBy("tr.due_month", "asc")
    .orderBy("tr.due_day", "asc")
    .execute();
};

// GET REMINDER BY ID
export const getTuitionReminderById = async (reminder_id) => {
  return await db
    .selectFrom("tuition_reminders as tr")
    .innerJoin(
      "payment_option as po",
      "tr.payment_option_id",
      "po.payment_option_id",
    )
    .select([
      "tr.reminder_id",
      "tr.payment_option_id",
      "po.option_name",
      "tr.due_month",
      "tr.due_day",
      "tr.days_before",
      "tr.is_active",
      "tr.created_at",
      "tr.updated_at",
    ])
    .where("tr.reminder_id", "=", Number(reminder_id))
    .executeTakeFirst();
};

// CREATE REMINDER
export const createTuitionReminder = async (data, created_by) => {
  const values = validateTuitionReminder(data);

  const paymentOption = await db
    .selectFrom("payment_option")
    .select(["payment_option_id", "option_name"])
    .where("payment_option_id", "=", values.payment_option_id)
    .executeTakeFirst();

  if (!paymentOption) {
    throw new Error("Payment option not found.");
  }

  const existing = await db
    .selectFrom("tuition_reminders")
    .select("reminder_id")
    .where("payment_option_id", "=", values.payment_option_id)
    .where("due_month", "=", values.due_month)
    .where("due_day", "=", values.due_day)
    .where("days_before", "=", values.days_before)
    .where("is_active", "=", 1)
    .executeTakeFirst();

  if (existing) {
    throw new Error("This tuition reminder already exists.");
  }

  const result = await db
    .insertInto("tuition_reminders")
    .values({
      ...values,
      created_by: created_by ? Number(created_by) : null,
      is_active: 1,
    })
    .executeTakeFirst();

  await logAdminActivity({
    user_id: created_by,
    user_action: "Created",
    user_module: "Tuition Reminders",
    description: `Created tuition reminder for ${paymentOption.option_name}.`,
  });

  return await getTuitionReminderById(Number(result.insertId));
};

// UPDATE REMINDER
export const updateTuitionReminder = async (reminder_id, data, user_id) => {
  const id = Number(reminder_id);
  const values = validateTuitionReminder(data);

  const existing = await db
    .selectFrom("tuition_reminders")
    .select("reminder_id")
    .where("reminder_id", "=", id)
    .where("is_active", "=", 1)
    .executeTakeFirst();

  if (!existing) {
    throw new Error("Tuition reminder not found.");
  }

  const duplicate = await db
    .selectFrom("tuition_reminders")
    .select("reminder_id")
    .where("payment_option_id", "=", values.payment_option_id)
    .where("due_month", "=", values.due_month)
    .where("due_day", "=", values.due_day)
    .where("days_before", "=", values.days_before)
    .where("is_active", "=", 1)
    .where("reminder_id", "!=", id)
    .executeTakeFirst();

  if (duplicate) {
    throw new Error("This tuition reminder already exists.");
  }

  const paymentOption = await db
    .selectFrom("payment_option")
    .select("option_name")
    .where("payment_option_id", "=", values.payment_option_id)
    .executeTakeFirst();

  await db
    .updateTable("tuition_reminders")
    .set(values)
    .where("reminder_id", "=", id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Tuition Reminders",
    description: `Updated tuition reminder for ${paymentOption?.option_name ?? "payment option"}.`,
  });

  return await getTuitionReminderById(id);
};

// DELETE REMINDER (SOFT DELETE)
export const deleteTuitionReminder = async (reminder_id, user_id) => {
  const reminder = await db
    .selectFrom("tuition_reminders as tr")
    .innerJoin(
      "payment_option as po",
      "tr.payment_option_id",
      "po.payment_option_id",
    )
    .select("po.option_name")
    .where("tr.reminder_id", "=", Number(reminder_id))
    .executeTakeFirst();

  const result = await db
    .deleteFrom("tuition_reminders")
    .where("reminder_id", "=", Number(reminder_id))
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Deleted",
    user_module: "Tuition Reminders",
    description: `Deleted tuition reminder for ${reminder?.option_name ?? "payment option"}.`,
  });

  return Number(result.numDeletedRows) > 0;
};

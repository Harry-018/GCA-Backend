import db from "../config/db.js";
import { sql } from "kysely";

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

export const editAnnouncementInGradeLevel = async (announcement_id, data) => {
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

export const deleteAnnouncementInGradeLevel = async (announcement_id) => {
  const existing = await db
    .selectFrom("announcements")
    .select("announcement_id")
    .where("announcement_id", "=", announcement_id)
    .executeTakeFirst();

  if (!existing) {
    throw new Error("Announcement not found.");
  }

  await db
    .deleteFrom("announcements")
    .where("announcement_id", "=", announcement_id)
    .executeTakeFirst();

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
  return await db
    .insertInto("notifications")
    .values({
      template_id,
      audience,
      created_by,
      sent_at,
      payment_option_id,
    })
    .executeTakeFirst();
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
      "pi.email",
      "s.stu_id",
      "s.stu_num",
      "po.payment_option_id",
      "po.option_name",
    ])
    .where("sy.sy_status", "=", "active")
    .where("sgl.sy_gradelevel_status", "=", "active")
    .where("e.enr_status", "=", "enrolled")
    .where("s.stu_status", "=", "active")
    .where("sub.sub_status", "=", "confirmed")
    .where("aa.approval_status", "=", "approved")
    .where("a.application_status", "=", "approved")
    .where("ap.will_receive_account", "=", 1)
    .where("po.payment_option_id", "=", Number(payment_option_id))
    .where("pi.email", "is not", null)
    .where("pi.email", "!=", "")
    .orderBy("pi.last_name", "asc")
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

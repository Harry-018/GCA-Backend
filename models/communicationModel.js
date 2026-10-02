import db from "../config/db.js";

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
  // Make sure the grade level exists and is active
  const gradeLevel = await db
    .selectFrom("schoolyears_gradelevels")
    .select("sy_grade_level_id")
    .where("sy_grade_level_id", "=", sy_grade_level_id)
    .where("sy_gradelevel_status", "=", "active")
    .executeTakeFirst();

  if (!gradeLevel) {
    throw new Error("Grade level is not found or is not active.");
  }

  // Make sure the authenticated user exists
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

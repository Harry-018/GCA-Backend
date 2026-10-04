import db from "../config/db.js";

//============ banner

export const getBanner = async () => {
  const banner = await db
    .selectFrom("banner")
    .select(["banner_id", "banner_title", "banner_image", "banner_quote"])
    .where("banner_id", "=", 1)
    .executeTakeFirst();

  const schoolYear = await db
    .selectFrom("school_years")
    .select(["school_year_id", "start_date", "end_date", "enrollment_status"])
    .where("sy_status", "=", "active")
    .executeTakeFirst();

  return {
    ...banner,
    school_year: schoolYear
      ? `${new Date(schoolYear.start_date).getFullYear()} - ${new Date(
          schoolYear.end_date,
        ).getFullYear()}`
      : null,
    enrollment_status: schoolYear?.enrollment_status ?? null,
  };
};

export const editBanner = async (data) => {
  const banner = await db
    .updateTable("banner")
    .set({
      banner_title: data.banner_title,
      banner_image: data.banner_image,
      banner_quote: data.banner_quote,
    })
    .where("banner_id", "=", 1)
    .executeTakeFirst();

  return banner;
};

// ============ video

export const getVideo = async () => {
  const video = await db.selectFrom("home_video").selectAll().execute();
  return video;
};

export const editVideo = async (data) => {
  const video = await db
    .updateTable("home_video")
    .set({
      video_title: data.video_title,
      video_url: data.video_url,
    })
    .where("video_id", "=", 1)
    .executeTakeFirst();
  return video;
};

// ============= choose us

export const getReasons = async () => {
  const reason = await db.selectFrom("choose_us").selectAll().execute();
  return reason;
};

export const addReason = async (data) => {
  const reason = await db
    .insertInto("choose_us")
    .values({ reasons: data.reasons })
    .execute();
  return reason;
};

export const editReason = async (reason_id, data) => {
  const reason = await db
    .updateTable("choose_us")
    .set({
      reasons: data.reasons,
    })
    .where("reason_id", "=", reason_id)
    .executeTakeFirst();
  return reason;
};

export const deleteReason = async (reason_id) => {
  const reason = await db
    .deleteFrom("choose_us")
    .where("reason_id", "=", reason_id)
    .executeTakeFirst();
  return reason;
};

// ================== academic programs

export const getAcademicPrograms = async () => {
  const programs = await db
    .selectFrom("academic_programs as ap")
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "ap.grade_level_id")
    .select([
      "ap.program_id",
      "ap.grade_level_id",
      "gl.grade_level_name",
      "ap.image_url",
      "ap.min_age",
      "ap.max_age",
      "ap.description",
    ])
    .execute();

  return programs;
};

export const getGradeLevels = async () => {
  const gradeLevel = await db.selectFrom("grade_levels").selectAll().execute();
  return gradeLevel;
};

export const addAcademicPrograms = async (data) => {
  const programs = await db
    .insertInto("academic_programs")
    .values({
      grade_level_id: data.grade_level_id,
      image_url: data.image_url,
      min_age: data.min_age,
      max_age: data.max_age,
      description: data.description,
    })
    .executeTakeFirst();
  return programs;
};

export const editAcademicPrograms = async (program_id, data) => {
  const programs = await db
    .updateTable("academic_programs")
    .set({
      grade_level_id: data.grade_level_id,
      image_url: data.image_url,
      min_age: data.min_age,
      max_age: data.max_age,
      description: data.description,
    })
    .where("program_id", "=", program_id)
    .executeTakeFirst();
  return programs;
};

export const deleteAcademicProgram = async (program_id) => {
  const programs = await db
    .deleteFrom("academic_programs")
    .where("program_id", "=", program_id)
    .executeTakeFirst();
  return programs;
};

// ================== mission vision

export const getMissionVision = async () => {
  const missvis = await db.selectFrom("mission_vision").selectAll().execute();
  return missvis;
};

export const editMissionVision = async (data) => {
  const missvis = await db
    .updateTable("mission_vision")
    .set({
      mission_title: data.mission_title,
      mission_body: data.mission_body,
      vision_title: data.vision_title,
      vision_body: data.vision_body,
    })
    .where("mission_vision_id", "=", 1)
    .executeTakeFirst();
  return missvis;
};

// ================== children activities

export const getChildrenActivities = async () => {
  const activities = await db
    .selectFrom("children_activities")
    .selectAll()
    .execute();

  return activities;
};

export const addChildrenActivity = async (data) => {
  const activity = await db
    .insertInto("children_activities")
    .values({
      activity_title: data.activity_title,
      activity_description: data.activity_description,
      activity_image: data.activity_image,
    })
    .executeTakeFirst();

  return activity;
};

export const editChildrenActivity = async (activity_id, data) => {
  const activity = await db
    .updateTable("children_activities")
    .set({
      activity_title: data.activity_title,
      activity_description: data.activity_description,
      activity_image: data.activity_image,
    })
    .where("activity_id", "=", activity_id)
    .executeTakeFirst();

  return activity;
};

export const deleteChildrenActivity = async (activity_id) => {
  const activity = await db
    .deleteFrom("children_activities")
    .where("activity_id", "=", activity_id)
    .executeTakeFirst();

  return activity;
};

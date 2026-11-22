import db from "../config/db.js";
import { logAdminActivity } from "./activityLogsModel.js";

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
    school_start: schoolYear
      ? new Date(schoolYear.start_date).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        })
      : null,
  };
};

export const editBanner = async (data, user_id) => {
  const updateData = {
    banner_title: data.banner_title,
    banner_quote: data.banner_quote,
  };

  if (data.banner_image) {
    updateData.banner_image = data.banner_image;
  }

  await db
    .updateTable("banner")
    .set(updateData)
    .where("banner_id", "=", 1)
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Homepage",
    description: "Updated banner.",
  });

  return {
    message: "Banner updated successfully",
  };
};

// ============ video

export const getVideo = async () => {
  const video = await db.selectFrom("home_video").selectAll().execute();
  return video;
};

export const editVideo = async (data, user_id) => {
  const updateData = {
    video_title: data.video_title,
  };

  if (data.video_url) {
    updateData.videourl = data.video_url;
  }

  await db
    .updateTable("home_video")
    .set(updateData)
    .where("video_id", "=", 1)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Homepage",
    description: "Updated home video.",
  });

  return {
    message: "Video updated successfully",
  };
};

// ============= choose us

export const getReasons = async () => {
  const reasons = await db
    .selectFrom("choose_us")
    .selectAll()
    .orderBy("reason_id", "asc")
    .execute();

  return reasons;
};

export const addReason = async (data, user_id) => {
  await db
    .insertInto("choose_us")
    .values({
      reasons: data.reasons,
    })
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Created",
    user_module: "Homepage",
    description: `Created reason "${data.reasons}".`,
  });

  return true;
};
export const editReason = async (reason_id, data, user_id) => {
  await db
    .updateTable("choose_us")
    .set({
      reasons: data.reasons,
    })
    .where("reason_id", "=", reason_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Homepage",
    description: `Updated reason "${data.reasons}".`,
  });

  return true;
};

export const deleteReason = async (reason_id, user_id) => {
  const reason = await db
    .selectFrom("choose_us")
    .select("reasons")
    .where("reason_id", "=", reason_id)
    .executeTakeFirst();

  await db
    .deleteFrom("choose_us")
    .where("reason_id", "=", reason_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Deleted",
    user_module: "Homepage",
    description: `Deleted reason "${reason?.reasons ?? "reason"}".`,
  });

  return true;
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

export const addAcademicPrograms = async (data, user_id) => {
  await db
    .insertInto("academic_programs")
    .values({
      grade_level_id: data.grade_level_id,
      image_url: data.image_url,
      min_age: data.min_age,
      max_age: data.max_age,
      description: data.description,
    })
    .execute();

  const gradeLevel = await db
    .selectFrom("grade_levels")
    .select("grade_level_name")
    .where("grade_level_id", "=", data.grade_level_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Created",
    user_module: "Homepage",
    description: `Created academic program for ${gradeLevel?.grade_level_name ?? "grade level"}.`,
  });

  return {
    message: "Academic program added successfully",
  };
};

export const editAcademicPrograms = async (program_id, data, user_id) => {
  const updateData = {
    grade_level_id: data.grade_level_id,
    min_age: data.min_age,
    max_age: data.max_age,
    description: data.description,
  };

  if (data.image_url) {
    updateData.image_url = data.image_url;
  }

  await db
    .updateTable("academic_programs")
    .set(updateData)
    .where("program_id", "=", program_id)
    .execute();

  const gradeLevel = await db
    .selectFrom("grade_levels")
    .select("grade_level_name")
    .where("grade_level_id", "=", data.grade_level_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Homepage",
    description: `Updated academic program for ${gradeLevel?.grade_level_name ?? "grade level"}.`,
  });

  return {
    message: "Academic program updated successfully",
  };
};

export const deleteAcademicProgram = async (program_id, user_id) => {
  const program = await db
    .selectFrom("academic_programs as ap")
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "ap.grade_level_id")
    .select("gl.grade_level_name")
    .where("ap.program_id", "=", program_id)
    .executeTakeFirst();

  await db
    .deleteFrom("academic_programs")
    .where("program_id", "=", program_id)
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Deleted",
    user_module: "Homepage",
    description: `Deleted academic program for ${program?.grade_level_name ?? "grade level"}.`,
  });

  return {
    message: "Academic program deleted successfully",
  };
};

// ================== mission vision

export const getMissionVision = async () => {
  const missvis = await db.selectFrom("mission_vision").selectAll().execute();
  return missvis;
};

export const editMissionVision = async (data, user_id) => {
  await db
    .updateTable("mission_vision")
    .set({
      mission_title: data.mission_title,
      mission_body: data.mission_body,
      vision_title: data.vision_title,
      vision_body: data.vision_body,
    })
    .where("mission_vision_id", "=", 1)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Homepage",
    description: "Updated mission and vision.",
  });

  return {
    message: "mission and vision updated successfully",
  };
};

// ================== children activities

export const getChildrenActivities = async () => {
  const r = await db.selectFrom("children_activities").selectAll().execute();

  return {
    r,
    message: "get children activities",
  };
};

export const addChildrenActivity = async (data, user_id) => {
  await db
    .insertInto("children_activities")
    .values({
      activity_title: data.activity_title,
      activity_description: data.activity_description,
      activity_image: data.activity_image,
    })
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Created",
    user_module: "Homepage",
    description: `Created children activity "${data.activity_title}".`,
  });

  return {
    message: "Activity added successfully",
  };
};

export const editChildrenActivity = async (activity_id, data, user_id) => {
  const updateActivity = {
    activity_title: data.activity_title,
    activity_description: data.activity_description,
    activity_image: data.activityImage,
  };

  if (data.activity_image) {
    updateActivity.activity_image = data.activityImage;
  }

  await db
    .updateTable("children_activities")
    .set(updateActivity)
    .where("activity_id", "=", activity_id)
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Homepage",
    description: `Updated children activity "${data.activity_title}".`,
  });

  return {
    message: "Activity updated successfully",
  };
};

export const deleteChildrenActivity = async (activity_id, user_id) => {
  const activity = await db
    .selectFrom("children_activities")
    .select("activity_title")
    .where("activity_id", "=", activity_id)
    .executeTakeFirst();

  await db
    .deleteFrom("children_activities")
    .where("activity_id", "=", activity_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Deleted",
    user_module: "Homepage",
    description: `Deleted children activity "${activity?.activity_title ?? "activity"}".`,
  });

  return true;
};

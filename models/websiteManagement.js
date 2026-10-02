import db from "../config/db";

export const getWebManagement = async () => {
  const banner = await db.selectFrom("banner").selectAll().execute();

  const academicPrograms = await db
    .selectFrom("academic_programs as ap")
    .leftJoin(
      "schoolyears_gradelevels as sgl",
      "ap.sy_grade_level_id",
      "sygl.sy_grade_level_id",
    )
    .select(["ap.program_id", "ap.image_url", "ap.ages", "ap.description"])
    .where("sygl.sy_grade_level_status", "=", "active")
    .execute();

  const videoPresentation = await db
    .selectFrom("video")
    .select(["video_id", "video_title", "video_presentation"])
    .execute();

  const reason = await db
    .selectFrom("reasons")
    .select(["reason_id", "reason"])
    .execute();

  const missionVision = await db
    .selectFrom("mission_vision")
    .selectAll()
    .execute();

  const activities = await db
    .selectFrom("children_activities")
    .select([
      "activity_id",
      "activity_title",
      "activity_description",
      "activity_image",
    ])
    .execute();

  const transportation = await db
    .selectFrom("transportation")
    .select(["transporation_id", "city", "location", "amount", "distance"])
    .execute();

  return (
    banner,
    academicPrograms,
    videoPresentation,
    reason,
    missionVision,
    activities
  );
};

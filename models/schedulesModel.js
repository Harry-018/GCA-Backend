import db from "../config/db.js";

//works
export const getScheduleGradeLevels = async () => {
  return await db
    .selectFrom("schoolyears_gradelevels as sgl")
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .leftJoin("sections as s", "sgl.sy_grade_level_id", "s.sy_grade_level_id")
    .select([
      "sgl.sy_grade_level_id",
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
    ])
    .select(({ fn }) => [fn.count("s.section_id").as("section_count")])
    .where("sy.sy_status", "=", "active")
    .where("sgl.sy_gradelevel_status", "=", "active")
    .where((eb) =>
      eb.or([
        eb("s.section_status", "=", "active"),
        eb("s.section_id", "is", null),
      ]),
    )
    .groupBy([
      "sgl.sy_grade_level_id",
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
    ])
    .orderBy("gl.grade_level_id", "asc")
    .execute();
};
//works
export const getScheduleSections = async (sy_grade_level_id) => {
  return await db
    .selectFrom("sections as s")
    .innerJoin("section_names as sn", "s.section_name_id", "sn.section_name_id")
    .select([
      "s.section_id",
      "s.section_name_id",
      "sn.section_name",
      "s.sy_grade_level_id",
      "s.adviser_teacher_id",
      "s.section_status",
    ])
    .where("s.sy_grade_level_id", "=", sy_grade_level_id)
    .where("s.section_status", "=", "active")
    .orderBy("sn.section_name", "asc")
    .execute();
};
//works
export const getSectionSchedules = async (section_id) => {
  return await db
    .selectFrom("schedules as s")
    .innerJoin("subjects as sub", "s.subject_id", "sub.subject_id")
    .innerJoin("teachers as t", "s.teacher_id", "t.teacher_id")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("rooms as r", "s.room_id", "r.room_id")
    .innerJoin("week_days as wd", "s.day_id", "wd.day_id")
    .innerJoin("schedule_time as st", "s.sched_time_id", "st.sched_time_id")
    .select([
      "s.schedule_id",

      "s.section_id",

      "s.subject_id",
      "sub.subject_name",

      "s.teacher_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",

      "s.day_id",
      "wd.day_name",

      "s.room_id",
      "r.room_name",

      "s.sched_time_id",
      "st.sched_start_time",
      "st.sched_end_time",
    ])
    .where("s.section_id", "=", section_id)
    .orderBy("s.day_id", "asc")
    .orderBy("st.sched_start_time", "asc")
    .execute();
};
//works
export const getScheduleSubjects = async (section_id) => {
  const section = await db
    .selectFrom("sections")
    .select(["section_id", "sy_grade_level_id", "section_status"])
    .where("section_id", "=", section_id)
    .executeTakeFirst();

  if (!section) {
    throw new Error("Section not found.");
  }

  if (section.section_status !== "active") {
    throw new Error("Section is inactive.");
  }

  return await db
    .selectFrom("schoolyears_gradelevels_subjects as sgls")
    .innerJoin("subjects as sub", "sgls.subject_id", "sub.subject_id")
    .select([
      "sgls.sy_gradelevel_subject_id",
      "sgls.sy_grade_level_id",
      "sub.subject_id",
      "sub.subject_name",
    ])
    .where("sgls.sy_grade_level_id", "=", section.sy_grade_level_id)
    .orderBy("sub.subject_name", "asc")
    .execute();
};
//works
export const getScheduleTeachers = async () => {
  return await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("user_accounts as ua", "ti.user_id", "ua.user_id")
    .select([
      "t.teacher_id",
      "t.teacher_num",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "ua.user_id",
      "ua.email",
    ])
    .where("t.teacher_status", "=", "active")
    .where("ua.account_status", "=", "active")
    .orderBy("ti.last_name", "asc")
    .orderBy("ti.first_name", "asc")
    .execute();
};
//works
export const getScheduleRooms = async () => {
  return await db
    .selectFrom("rooms")
    .select(["room_id", "room_name"])
    .orderBy("room_name", "asc")
    .execute();
};
//works
export const getScheduleDays = async () => {
  return await db
    .selectFrom("week_days")
    .select(["day_id", "day_name"])
    .orderBy("day_id", "asc")
    .execute();
};
//works
export const getScheduleTimes = async () => {
  return await db
    .selectFrom("schedule_time")
    .select(["sched_time_id", "sched_start_time", "sched_end_time"])
    .orderBy("sched_start_time", "asc")
    .execute();
};

export const createSchedule = async (data) => {
  /*
   * ----------------------------------------------------------
   * Validate section
   * ----------------------------------------------------------
   */

  const section = await db
    .selectFrom("sections")
    .select(["section_id", "sy_grade_level_id", "section_status"])
    .where("section_id", "=", data.section_id)
    .executeTakeFirst();

  if (!section) {
    throw new Error("Section not found.");
  }

  if (section.section_status !== "active") {
    throw new Error("Cannot add a schedule to an inactive section.");
  }

  /*
   * ----------------------------------------------------------
   * Validate subject belongs to the section's grade level
   * ----------------------------------------------------------
   */

  const subject = await db
    .selectFrom("schoolyears_gradelevels_subjects as sgls")
    .innerJoin("subjects as sub", "sgls.subject_id", "sub.subject_id")
    .select([
      "sgls.sy_gradelevel_subject_id",
      "sgls.sy_grade_level_id",
      "sub.subject_id",
      "sub.subject_name",
    ])
    .where("sgls.sy_grade_level_id", "=", section.sy_grade_level_id)
    .where("sgls.subject_id", "=", data.subject_id)
    .executeTakeFirst();

  if (!subject) {
    throw new Error(
      "The selected subject is not assigned to this section's grade level.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Validate teacher
   * ----------------------------------------------------------
   */

  const teacher = await db
    .selectFrom("teachers")
    .select(["teacher_id", "teacher_status"])
    .where("teacher_id", "=", data.teacher_id)
    .executeTakeFirst();

  if (!teacher) {
    throw new Error("Teacher not found.");
  }

  if (teacher.teacher_status !== "active") {
    throw new Error("Selected teacher is not active.");
  }

  /*
   * ----------------------------------------------------------
   * Validate room
   * ----------------------------------------------------------
   */

  const room = await db
    .selectFrom("rooms")
    .select("room_id")
    .where("room_id", "=", data.room_id)
    .executeTakeFirst();

  if (!room) {
    throw new Error("Room not found.");
  }

  /*
   * ----------------------------------------------------------
   * Validate day
   * ----------------------------------------------------------
   */

  const day = await db
    .selectFrom("week_days")
    .select("day_id")
    .where("day_id", "=", data.day_id)
    .executeTakeFirst();

  if (!day) {
    throw new Error("Day not found.");
  }

  /*
   * ----------------------------------------------------------
   * Validate schedule time
   * ----------------------------------------------------------
   */

  const scheduleTime = await db
    .selectFrom("schedule_time")
    .select("sched_time_id")
    .where("sched_time_id", "=", data.sched_time_id)
    .executeTakeFirst();

  if (!scheduleTime) {
    throw new Error("Schedule time not found.");
  }

  /*
   * ----------------------------------------------------------
   * Check section conflict
   *
   * A section cannot have two subjects at the same
   * day and time.
   * ----------------------------------------------------------
   */

  const sectionConflict = await db
    .selectFrom("schedules")
    .select("schedule_id")
    .where("section_id", "=", data.section_id)
    .where("day_id", "=", data.day_id)
    .where("sched_time_id", "=", data.sched_time_id)
    .executeTakeFirst();

  if (sectionConflict) {
    throw new Error(
      "This section already has a schedule at the selected day and time.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Check teacher conflict
   *
   * A teacher cannot teach two sections at the same
   * day and time.
   * ----------------------------------------------------------
   */

  const teacherConflict = await db
    .selectFrom("schedules")
    .select("schedule_id")
    .where("teacher_id", "=", data.teacher_id)
    .where("day_id", "=", data.day_id)
    .where("sched_time_id", "=", data.sched_time_id)
    .executeTakeFirst();

  if (teacherConflict) {
    throw new Error(
      "This teacher is already assigned to another schedule at the selected day and time.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Check room conflict
   *
   * A room cannot be used by two sections at the same
   * day and time.
   * ----------------------------------------------------------
   */

  const roomConflict = await db
    .selectFrom("schedules")
    .select("schedule_id")
    .where("room_id", "=", data.room_id)
    .where("day_id", "=", data.day_id)
    .where("sched_time_id", "=", data.sched_time_id)
    .executeTakeFirst();

  if (roomConflict) {
    throw new Error(
      "This room is already being used at the selected day and time.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Insert schedule
   * ----------------------------------------------------------
   */

  const result = await db
    .insertInto("schedules")
    .values({
      section_id: data.section_id,
      sched_time_id: data.sched_time_id,
      room_id: data.room_id,
      teacher_id: data.teacher_id,
      subject_id: data.subject_id,
      day_id: data.day_id,
    })
    .executeTakeFirst();

  return {
    schedule_id: Number(result.insertId),
  };
};

export const editSchedule = async (schedule_id, data) => {
  /*
   * ----------------------------------------------------------
   * Get existing schedule
   * ----------------------------------------------------------
   */

  const existingSchedule = await db
    .selectFrom("schedules")
    .select(["schedule_id", "section_id"])
    .where("schedule_id", "=", schedule_id)
    .executeTakeFirst();

  if (!existingSchedule) {
    throw new Error("Schedule not found.");
  }

  /*
   * ----------------------------------------------------------
   * Validate section
   * ----------------------------------------------------------
   */

  const section = await db
    .selectFrom("sections")
    .select(["section_id", "sy_grade_level_id", "section_status"])
    .where("section_id", "=", data.section_id)
    .executeTakeFirst();

  if (!section) {
    throw new Error("Section not found.");
  }

  if (section.section_status !== "active") {
    throw new Error("Cannot assign a schedule to an inactive section.");
  }

  /*
   * ----------------------------------------------------------
   * Validate subject
   * ----------------------------------------------------------
   */

  const subject = await db
    .selectFrom("schoolyears_gradelevels_subjects as sgls")
    .innerJoin("subjects as sub", "sgls.subject_id", "sub.subject_id")
    .select([
      "sgls.sy_gradelevel_subject_id",
      "sgls.sy_grade_level_id",
      "sub.subject_id",
      "sub.subject_name",
    ])
    .where("sgls.sy_grade_level_id", "=", section.sy_grade_level_id)
    .where("sgls.subject_id", "=", data.subject_id)
    .executeTakeFirst();

  if (!subject) {
    throw new Error(
      "The selected subject is not assigned to this section's grade level.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Validate teacher
   * ----------------------------------------------------------
   */

  const teacher = await db
    .selectFrom("teachers")
    .select(["teacher_id", "teacher_status"])
    .where("teacher_id", "=", data.teacher_id)
    .executeTakeFirst();

  if (!teacher) {
    throw new Error("Teacher not found.");
  }

  if (teacher.teacher_status !== "active") {
    throw new Error("Selected teacher is not active.");
  }

  /*
   * ----------------------------------------------------------
   * Validate room
   * ----------------------------------------------------------
   */

  const room = await db
    .selectFrom("rooms")
    .select("room_id")
    .where("room_id", "=", data.room_id)
    .executeTakeFirst();

  if (!room) {
    throw new Error("Room not found.");
  }

  /*
   * ----------------------------------------------------------
   * Validate day
   * ----------------------------------------------------------
   */

  const day = await db
    .selectFrom("week_days")
    .select("day_id")
    .where("day_id", "=", data.day_id)
    .executeTakeFirst();

  if (!day) {
    throw new Error("Day not found.");
  }

  /*
   * ----------------------------------------------------------
   * Validate schedule time
   * ----------------------------------------------------------
   */

  const scheduleTime = await db
    .selectFrom("schedule_time")
    .select("sched_time_id")
    .where("sched_time_id", "=", data.sched_time_id)
    .executeTakeFirst();

  if (!scheduleTime) {
    throw new Error("Schedule time not found.");
  }

  /*
   * ----------------------------------------------------------
   * Check section conflict
   *
   * Exclude the schedule currently being edited.
   * ----------------------------------------------------------
   */

  const sectionConflict = await db
    .selectFrom("schedules")
    .select("schedule_id")
    .where("section_id", "=", data.section_id)
    .where("day_id", "=", data.day_id)
    .where("sched_time_id", "=", data.sched_time_id)
    .where("schedule_id", "!=", schedule_id)
    .executeTakeFirst();

  if (sectionConflict) {
    throw new Error(
      "This section already has a schedule at the selected day and time.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Check teacher conflict
   * ----------------------------------------------------------
   */

  const teacherConflict = await db
    .selectFrom("schedules")
    .select("schedule_id")
    .where("teacher_id", "=", data.teacher_id)
    .where("day_id", "=", data.day_id)
    .where("sched_time_id", "=", data.sched_time_id)
    .where("schedule_id", "!=", schedule_id)
    .executeTakeFirst();

  if (teacherConflict) {
    throw new Error(
      "This teacher is already assigned to another schedule at the selected day and time.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Check room conflict
   * ----------------------------------------------------------
   */

  const roomConflict = await db
    .selectFrom("schedules")
    .select("schedule_id")
    .where("room_id", "=", data.room_id)
    .where("day_id", "=", data.day_id)
    .where("sched_time_id", "=", data.sched_time_id)
    .where("schedule_id", "!=", schedule_id)
    .executeTakeFirst();

  if (roomConflict) {
    throw new Error(
      "This room is already being used at the selected day and time.",
    );
  }

  /*
   * ----------------------------------------------------------
   * Update
   * ----------------------------------------------------------
   */

  const result = await db
    .updateTable("schedules")
    .set({
      section_id: data.section_id,
      sched_time_id: data.sched_time_id,
      room_id: data.room_id,
      teacher_id: data.teacher_id,
      subject_id: data.subject_id,
      day_id: data.day_id,
    })
    .where("schedule_id", "=", schedule_id)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) !== 1) {
    throw new Error("Schedule not found.");
  }

  return {
    schedule_id: Number(schedule_id),
  };
};

export const deleteSchedule = async (schedule_id) => {
  const result = await db
    .deleteFrom("schedules")
    .where("schedule_id", "=", schedule_id)
    .executeTakeFirst();

  if (Number(result.numDeletedRows) !== 1) {
    throw new Error("Schedule not found.");
  }

  return {
    schedule_id: Number(schedule_id),
  };
};

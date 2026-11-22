import db from "../config/db.js";
import { logAdminActivity } from "./activityLogsModel.js";

//works
export const getScheduleSchoolYears = async () => {
  return await db
    .selectFrom("school_years")
    .select(["school_year_id", "start_date", "end_date", "sy_status"])
    .where("sy_status", "in", ["active", "archived"])
    .orderBy("start_date", "desc")
    .execute();
};

export const getScheduleGradeLevels = async (school_year_id) => {
  let query = db
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
      "sy.sy_status",
    ])
    .select(({ fn }) => [fn.count("s.section_id").as("section_count")])
    .where("sgl.sy_gradelevel_status", "=", "active")
    .where((eb) =>
      eb.or([
        eb("s.section_status", "=", "active"),
        eb("s.section_id", "is", null),
      ]),
    );

  if (school_year_id) {
    query = query.where("sy.school_year_id", "=", Number(school_year_id));
  } else {
    query = query.where("sy.sy_status", "=", "active");
  }

  return await query
    .groupBy([
      "sgl.sy_grade_level_id",
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
      "sy.sy_status",
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

const getScheduleActivityDetails = async (executor, schedule_id) => {
  const schedule = await executor
    .selectFrom("schedules as sc")
    .innerJoin("sections as sec", "sec.section_id", "sc.section_id")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "sygl.sy_grade_level_id",
      "sec.sy_grade_level_id",
    )
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "sygl.grade_level_id")
    .innerJoin(
      "section_name_versions as snv",
      "snv.section_name_version_id",
      "sec.section_name_version_id",
    )
    .innerJoin("subjects as sub", "sub.subject_id", "sc.subject_id")
    .innerJoin("teachers as t", "t.teacher_id", "sc.teacher_id")
    .innerJoin("teacher_info as ti", "ti.teacher_info_id", "t.teacher_info_id")
    .innerJoin("rooms as r", "r.room_id", "sc.room_id")
    .innerJoin("week_days as wd", "wd.day_id", "sc.day_id")
    .innerJoin("schedule_time as st", "st.sched_time_id", "sc.sched_time_id")
    .select([
      "gl.grade_level_name",
      "snv.section_name",
      "sub.subject_name",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "r.room_name",
      "wd.day_name",
      "st.sched_start_time",
      "st.sched_end_time",
    ])
    .where("sc.schedule_id", "=", schedule_id)
    .executeTakeFirst();

  if (!schedule) {
    throw new Error("Schedule details not found.");
  }

  const teacherName = [
    schedule.first_name,
    schedule.middle_name,
    schedule.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...schedule,
    teacher_name: teacherName,
  };
};

const formatScheduleDescription = (schedule) => {
  return `${schedule.subject_name} for ${schedule.grade_level_name} - ${schedule.section_name}, taught by ${schedule.teacher_name}, in ${schedule.room_name} on ${schedule.day_name} (${schedule.sched_start_time} - ${schedule.sched_end_time})`;
};

export const createSchedule = async (data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    // 1. Validate section and retrieve its school year
    const section = await trx
      .selectFrom("sections as sec")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sec.sy_grade_level_id",
      )
      .select([
        "sec.section_id",
        "sec.sy_grade_level_id",
        "sec.section_status",
        "sygl.school_year_id",
      ])
      .where("sec.section_id", "=", data.section_id)
      .executeTakeFirst();

    if (!section) {
      throw new Error("Section not found.");
    }

    if (section.section_status !== "active") {
      throw new Error("Cannot add a schedule to an inactive section.");
    }

    // 2. Validate subject belongs to the section's grade level
    const subject = await trx
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

    // 3. Validate teacher
    const teacher = await trx
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

    // 4. Validate room
    const room = await trx
      .selectFrom("rooms")
      .select("room_id")
      .where("room_id", "=", data.room_id)
      .executeTakeFirst();

    if (!room) {
      throw new Error("Room not found.");
    }

    // 5. Validate day
    const day = await trx
      .selectFrom("week_days")
      .select("day_id")
      .where("day_id", "=", data.day_id)
      .executeTakeFirst();

    if (!day) {
      throw new Error("Day not found.");
    }

    // 6. Validate schedule time
    const scheduleTime = await trx
      .selectFrom("schedule_time")
      .select("sched_time_id")
      .where("sched_time_id", "=", data.sched_time_id)
      .executeTakeFirst();

    if (!scheduleTime) {
      throw new Error("Schedule time not found.");
    }

    // 7. Check section conflict
    const sectionConflict = await trx
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

    // 8. Check teacher conflict within the same school year
    const teacherConflict = await trx
      .selectFrom("schedules as sc")
      .innerJoin("sections as sec", "sec.section_id", "sc.section_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sec.sy_grade_level_id",
      )
      .select("sc.schedule_id")
      .where("sc.teacher_id", "=", data.teacher_id)
      .where("sc.day_id", "=", data.day_id)
      .where("sc.sched_time_id", "=", data.sched_time_id)
      .where("sygl.school_year_id", "=", section.school_year_id)
      .executeTakeFirst();

    if (teacherConflict) {
      throw new Error(
        "This teacher is already assigned to another schedule at the selected day and time.",
      );
    }

    // 9. Check room conflict within the same school year
    const roomConflict = await trx
      .selectFrom("schedules as sc")
      .innerJoin("sections as sec", "sec.section_id", "sc.section_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sec.sy_grade_level_id",
      )
      .select("sc.schedule_id")
      .where("sc.room_id", "=", data.room_id)
      .where("sc.day_id", "=", data.day_id)
      .where("sc.sched_time_id", "=", data.sched_time_id)
      .where("sygl.school_year_id", "=", section.school_year_id)
      .executeTakeFirst();

    if (roomConflict) {
      throw new Error(
        "This room is already being used at the selected day and time.",
      );
    }

    // 10. Insert schedule
    const result = await trx
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

    const schedule_id = Number(result.insertId);

    // 11. Retrieve schedule details for activity log
    const schedule = await getScheduleActivityDetails(trx, schedule_id);

    // 12. Log activity
    await logAdminActivity(
      {
        user_id,
        user_action: "Created",
        user_module: "Schedules",
        description: `Created schedule: ${formatScheduleDescription(schedule)}.`,
      },
      trx,
    );

    return { schedule_id };
  });
};

export const editSchedule = async (schedule_id, data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    // 1. Retrieve existing schedule details
    const existingSchedule = await getScheduleActivityDetails(trx, schedule_id);

    if (!existingSchedule) {
      throw new Error("Schedule not found.");
    }

    // 2. Validate section and retrieve its school year
    const section = await trx
      .selectFrom("sections as sec")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sec.sy_grade_level_id",
      )
      .select([
        "sec.section_id",
        "sec.sy_grade_level_id",
        "sec.section_status",
        "sygl.school_year_id",
      ])
      .where("sec.section_id", "=", data.section_id)
      .executeTakeFirst();

    if (!section) {
      throw new Error("Section not found.");
    }

    if (section.section_status !== "active") {
      throw new Error("Cannot assign a schedule to an inactive section.");
    }

    // 3. Validate subject belongs to the section's grade level
    const subject = await trx
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

    // 4. Validate teacher
    const teacher = await trx
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

    // 5. Validate room
    const room = await trx
      .selectFrom("rooms")
      .select("room_id")
      .where("room_id", "=", data.room_id)
      .executeTakeFirst();

    if (!room) {
      throw new Error("Room not found.");
    }

    // 6. Validate day
    const day = await trx
      .selectFrom("week_days")
      .select("day_id")
      .where("day_id", "=", data.day_id)
      .executeTakeFirst();

    if (!day) {
      throw new Error("Day not found.");
    }

    // 7. Validate schedule time
    const scheduleTime = await trx
      .selectFrom("schedule_time")
      .select("sched_time_id")
      .where("sched_time_id", "=", data.sched_time_id)
      .executeTakeFirst();

    if (!scheduleTime) {
      throw new Error("Schedule time not found.");
    }

    // 8. Check section conflict
    const sectionConflict = await trx
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

    // 9. Check teacher conflict within the same school year
    const teacherConflict = await trx
      .selectFrom("schedules as sc")
      .innerJoin("sections as sec", "sec.section_id", "sc.section_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sec.sy_grade_level_id",
      )
      .select("sc.schedule_id")
      .where("sc.teacher_id", "=", data.teacher_id)
      .where("sc.day_id", "=", data.day_id)
      .where("sc.sched_time_id", "=", data.sched_time_id)
      .where("sygl.school_year_id", "=", section.school_year_id)
      .where("sc.schedule_id", "!=", schedule_id)
      .executeTakeFirst();

    if (teacherConflict) {
      throw new Error(
        "This teacher is already assigned to another schedule at the selected day and time.",
      );
    }

    // 10. Check room conflict within the same school year
    const roomConflict = await trx
      .selectFrom("schedules as sc")
      .innerJoin("sections as sec", "sec.section_id", "sc.section_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sec.sy_grade_level_id",
      )
      .select("sc.schedule_id")
      .where("sc.room_id", "=", data.room_id)
      .where("sc.day_id", "=", data.day_id)
      .where("sc.sched_time_id", "=", data.sched_time_id)
      .where("sygl.school_year_id", "=", section.school_year_id)
      .where("sc.schedule_id", "!=", schedule_id)
      .executeTakeFirst();

    if (roomConflict) {
      throw new Error(
        "This room is already being used at the selected day and time.",
      );
    }

    // 11. Update schedule
    await trx
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

    // 12. Retrieve updated schedule details
    const updatedSchedule = await getScheduleActivityDetails(trx, schedule_id);

    // 13. Log activity
    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Schedules",
        description: `Updated schedule from: ${formatScheduleDescription(existingSchedule)}. New schedule: ${formatScheduleDescription(updatedSchedule)}.`,
      },
      trx,
    );

    return {
      schedule_id: Number(schedule_id),
    };
  });
};

export const deleteSchedule = async (schedule_id, user_id) => {
  return await db.transaction().execute(async (trx) => {
    // 1. Retrieve schedule details before deletion
    const schedule = await getScheduleActivityDetails(trx, schedule_id);

    // 2. Delete schedule
    const result = await trx
      .deleteFrom("schedules")
      .where("schedule_id", "=", schedule_id)
      .executeTakeFirst();

    if (Number(result.numDeletedRows) !== 1) {
      throw new Error("Schedule not found.");
    }

    // 3. Log activity
    await logAdminActivity(
      {
        user_id,
        user_action: "Deleted",
        user_module: "Schedules",
        description: `Deleted schedule: ${formatScheduleDescription(schedule)}.`,
      },
      trx,
    );

    return {
      schedule_id: Number(schedule_id),
    };
  });
};

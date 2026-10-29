import db from "../config/db.js";
import { sql } from "kysely";

export const getTeachers = async ({
  status = "all",
  search = "",
  page = 1,
  limit = 10,
}) => {
  const offset = (page - 1) * limit;

  let query = db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin(
      "teacher_address as ta",
      "ti.teacher_address_id",
      "ta.address_id",
    )
    .innerJoin("user_accounts as ua", "ti.user_id", "ua.user_id")
    .select([
      "t.teacher_id",
      "t.teacher_num",
      "t.teacher_status",

      "ti.teacher_info_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "ti.gender",
      "ti.bdate",
      "ti.birthplace",
      "ti.religion",
      "ti.civil_status",
      "ti.contact_num",

      "ta.address_id",
      "ta.province",
      "ta.zipcode",
      "ta.city_municipality",
      "ta.house_no",
      "ta.barangay",

      "ua.email",
      "ua.role",
      "ua.account_status",
    ]);

  if (status && status !== "all") {
    query = query.where("t.teacher_status", "=", status);
  }

  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;

    query = query.where((eb) =>
      eb.or([
        sql`LOWER(${sql.ref("ti.first_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.middle_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.last_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("t.teacher_num")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.email")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.contact_num")}) LIKE ${term}`,
      ]),
    );
  }

  const countResult = await query
    .clearSelect()
    .clearOrderBy()
    .select((eb) => eb.fn.count("t.teacher_id").as("total"))
    .executeTakeFirst();

  const total = Number(countResult?.total ?? 0);

  const teachers = await query
    .orderBy("ti.last_name", "asc")
    .orderBy("ti.first_name", "asc")
    .limit(limit)
    .offset(offset)
    .execute();

  return {
    data: teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTeacherInfo = async (teacher_id) => {
  const teacher = await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin(
      "teacher_address as ta",
      "ti.teacher_address_id",
      "ta.address_id",
    )
    .select([
      "t.teacher_id",
      "t.teacher_num",
      "t.teacher_status",

      "ti.teacher_info_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "ti.gender",
      "ti.bdate",
      "ti.birthplace",
      "ti.religion",
      "ti.civil_status",
      "ti.contact_num",
      "ti.email",
      "ti.user_id",

      "ta.address_id",
      "ta.province",
      "ta.zipcode",
      "ta.city_municipality",
      "ta.house_no",
      "ta.barangay",
    ])
    .where("t.teacher_id", "=", teacher_id)
    .executeTakeFirst();

  return teacher;
};

export const updateTeacher = async (teacher_id, data) => {
  const result = await db
    .updateTable("teachers")
    .set({
      teacher_status: data.teacher_status,
    })
    .where("teacher_id", "=", teacher_id)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) {
    return null;
  }

  return {
    teacher_id,
    teacher_status: data.teacher_status,
  };
};

//ACCOUNT SETTINGS

// TEACHER PORTAL INFORMATION
//get teacher info by account id(user_id)

export const getTeacherInfoByUserId = async (user_id) => {
  const teacher = await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin(
      "teacher_address as ta",
      "ti.teacher_address_id",
      "ta.address_id",
    )
    .innerJoin("user_accounts as ua", "ua.user_id", "ti.user_id")
    .select([
      // Teacher
      "t.teacher_id",
      "t.teacher_num",
      "t.teacher_status",

      // Teacher information
      "ti.teacher_info_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "ti.gender",
      "ti.bdate",
      "ti.birthplace",
      "ti.religion",
      "ti.civil_status",
      "ti.contact_num",
      "ti.email",

      // Teacher address
      "ta.address_id",
      "ta.province",
      "ta.zipcode",
      "ta.city_municipality",
      "ta.house_no",
      "ta.barangay",

      // User account
      "ua.user_id",
      "ua.email as account_email",
      "ua.role",
      "ua.account_status",
    ])
    .where("ua.user_id", "=", user_id)
    .executeTakeFirst();

  return teacher;
};

export const editTeacherInfo = async (data) => {
  const teacher = await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .select(["t.teacher_id", "ti.teacher_info_id"])
    .where("ti.user_id", "=", data.user_id)
    .executeTakeFirst();

  if (!teacher) {
    throw new Error("Teacher not found for user.");
  }

  await db
    .updateTable("teacher_info")
    .set({
      contact_num: data.contact_num,
      email: data.email,
    })
    .where("teacher_info_id", "=", teacher.teacher_info_id)
    .executeTakeFirst();

  return { success: true };
};

export const getTeacherSchedules = async (user_id) => {
  const schedules = await db
    .selectFrom("schedules as s")
    .innerJoin("teachers as t", "s.teacher_id", "t.teacher_id")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as sec", "s.section_id", "sec.section_id")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "sec.sy_grade_level_id",
      "sygl.sy_grade_level_id",
    )
    .innerJoin(
      "section_names as sn",
      "sec.section_name_id",
      "sn.section_name_id",
    )
    .innerJoin("school_years as sy", "sygl.school_year_id", "sy.school_year_id")
    .innerJoin("subjects as sub", "s.subject_id", "sub.subject_id")
    .innerJoin("rooms as r", "s.room_id", "r.room_id")
    .innerJoin("week_days as wd", "s.day_id", "wd.day_id")
    .innerJoin("schedule_time as st", "s.sched_time_id", "st.sched_time_id")
    .select([
      "s.schedule_id",
      "s.section_id",
      "s.teacher_id",
      "s.subject_id",
      "s.room_id",
      "s.day_id",
      "s.sched_time_id",
      "sub.subject_name",
      "r.room_name",
      "wd.day_name",
      "st.sched_start_time",
      "st.sched_end_time",
      "sn.section_name",
    ])
    .where("ti.user_id", "=", user_id)
    .where("sy.sy_status", "=", "active")
    .where("sec.section_status", "=", "active")
    .orderBy("wd.day_id", "asc")
    .orderBy("st.sched_start_time", "asc")
    .execute();

  return schedules;
};

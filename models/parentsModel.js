import db from "../config/db.js";
import { sql } from "kysely";

const buildParentQuery = () => {
  return db
    .selectFrom("students as s")
    .innerJoin("submissions as sub", "s.submission_id", "sub.submission_id")
    .innerJoin(
      "app_approval as aa",
      "sub.app_approval_id",
      "aa.app_approval_id",
    )
    .innerJoin("applications as a", "aa.application_id", "a.application_id")
    .innerJoin(
      "applicant_parent as ap",
      "a.application_id",
      "ap.application_id",
    )
    .innerJoin("parent_info as p", "ap.parent_info_id", "p.parent_info_id")
    .where("s.stu_status", "=", "active")
    .where("ap.will_receive_account", "=", true);
};

export const getParents = async ({ search = "", page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  /*
   * Main parent query
   */
  let query = buildParentQuery()
    .select([
      "p.parent_info_id",
      "p.last_name",
      "p.first_name",
      "p.email",
      "p.contact_number",
    ])
    .select(sql`COUNT(DISTINCT ${sql.ref("s.stu_id")})`.as("children"))
    .groupBy([
      "p.parent_info_id",
      "p.last_name",
      "p.first_name",
      "p.email",
      "p.contact_number",
    ]);

  /*
   * Search
   */
  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;

    query = query.where((eb) =>
      eb.or([
        sql`LOWER(${sql.ref("p.last_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("p.first_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("p.email")}) LIKE ${term}`,
      ]),
    );
  }

  /*
   * Count total parents
   */
  let countQuery = buildParentQuery().select(
    sql`COUNT(DISTINCT ${sql.ref("p.parent_info_id")})`.as("total"),
  );

  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;

    countQuery = countQuery.where((eb) =>
      eb.or([
        sql`LOWER(${sql.ref("p.last_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("p.first_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("p.email")}) LIKE ${term}`,
      ]),
    );
  }

  const countResult = await countQuery.executeTakeFirst();

  const total = Number(countResult?.total ?? 0);

  /*
   * Get paginated parents
   */
  const parents = await query
    .orderBy("p.last_name", "asc")
    .orderBy("p.first_name", "asc")
    .limit(limit)
    .offset(offset)
    .execute();

  return {
    data: parents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getParentInfoByUserId = async (user_id) => {
  return await db
    .selectFrom("parent_info as pi")
    .innerJoin("user_accounts as ua", "ua.user_id", "pi.user_id")
    // .innerJoin(
    //   "applicant_parent as ap",
    //   "ap.parent_info_id",
    //   "pi.parent_info_id",
    // )
    .select([
      "pi.parent_info_id",
      "pi.first_name",
      "pi.middle_name",
      "pi.last_name",
      "pi.contact_number",
      "pi.occupation",
      "pi.email",
      "ua.user_id",
      "ua.role",
      "ua.account_status",
      "ua.email as account_email",
      // "ap.relationship_type",
    ])
    .where("ua.user_id", "=", Number(user_id))
    .where("ua.role", "=", "parent")
    .executeTakeFirst();
};

export const getParentDashboardStudents = async (user_id) => {
  // Step 1: Get the parent's students and their current enrollment
  const students = await db
    .selectFrom("parent_info as pi")
    .innerJoin(
      "applicant_parent as ap",
      "ap.parent_info_id",
      "pi.parent_info_id",
    )
    .innerJoin("applications as a", "a.application_id", "ap.application_id")
    .innerJoin(
      "applicant_info as ai",
      "ai.applicant_info_id",
      "a.applicant_info_id",
    )
    .innerJoin("app_approval as aa", "aa.application_id", "a.application_id")
    .innerJoin(
      "submissions as sub",
      "sub.app_approval_id",
      "aa.app_approval_id",
    )
    .innerJoin("students as stu", "stu.submission_id", "sub.submission_id")
    .innerJoin("enrollment as e", "e.stu_id", "stu.stu_id")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "sygl.sy_grade_level_id",
      "e.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sy.school_year_id", "sygl.school_year_id")
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "sygl.grade_level_id")
    .leftJoin("sections as sec", "sec.section_id", "e.section_id")
    .leftJoin(
      "section_name_versions as snv",
      "snv.section_name_version_id",
      "sec.section_name_version_id",
    )
    .leftJoin(
      "teachers as adviser",
      "adviser.teacher_id",
      "sec.adviser_teacher_id",
    )
    .leftJoin(
      "teacher_info as adviser_info",
      "adviser_info.teacher_info_id",
      "adviser.teacher_info_id",
    )
    .select([
      "stu.stu_id",
      "stu.stu_num",
      "stu.lrn",
      "stu.stu_status",

      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",

      "e.enrollment_id",
      "e.enr_status",
      "e.date_enrolled",

      "sy.school_year_id",
      "sy.sy_status",

      "gl.grade_level_id",

      "sec.section_id",
      "snv.section_name",

      "adviser_info.first_name as adviser_first_name",
      "adviser_info.middle_name as adviser_middle_name",
      "adviser_info.last_name as adviser_last_name",
    ])
    .where("pi.user_id", "=", user_id)
    .where("stu.stu_status", "=", "active")
    .where("e.enr_status", "=", "enrolled")
    .where("sy.sy_status", "=", "active")
    .orderBy("ai.last_name")
    .orderBy("ai.first_name")
    .execute();

  if (students.length === 0) return [];

  // Step 2: Get the section IDs that have schedules
  const sectionIds = [
    ...new Set(
      students
        .map((student) => student.section_id)
        .filter((sectionId) => sectionId !== null),
    ),
  ];

  let schedules = [];

  // Step 3: Retrieve schedules for those sections
  if (sectionIds.length > 0) {
    schedules = await db
      .selectFrom("schedules as sc")
      .innerJoin("schedule_time as st", "st.sched_time_id", "sc.sched_time_id")
      .innerJoin("rooms as r", "r.room_id", "sc.room_id")
      .innerJoin("subjects as su", "su.subject_id", "sc.subject_id")
      .innerJoin("week_days as wd", "wd.day_id", "sc.day_id")
      .innerJoin("teachers as t", "t.teacher_id", "sc.teacher_id")
      .innerJoin(
        "teacher_info as ti",
        "ti.teacher_info_id",
        "t.teacher_info_id",
      )
      .select([
        "sc.schedule_id",
        "sc.section_id",
        "su.subject_name",
        "wd.day_name",
        "st.start_time",
        "st.end_time",
        "r.room_name",
        "ti.first_name as teacher_first_name",
        "ti.middle_name as teacher_middle_name",
        "ti.last_name as teacher_last_name",
      ])
      .where("sc.section_id", "in", sectionIds)
      .orderBy("wd.day_id")
      .orderBy("st.start_time")
      .execute();
  }

  // Step 4: Attach each section's schedules to its student
  return students.map((student) => {
    const studentSchedules = schedules.filter(
      (schedule) => schedule.section_id === student.section_id,
    );

    const fullName = [
      student.last_name,
      [student.first_name, student.middle_name].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ");

    const adviser = [
      student.adviser_first_name,
      student.adviser_middle_name,
      student.adviser_last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      studentId: student.stu_num,
      stuId: student.stu_id,
      fullName,
      lrn: student.lrn,

      enrollment: {
        enrollmentId: student.enrollment_id,
        status: student.enr_status,
        dateEnrolled: student.date_enrolled,
        sectionId: student.section_id,
        section: student.section_name,
      },

      schoolYear: {
        schoolYearId: student.school_year_id,
        status: student.sy_status,
      },

      gradeLevelId: student.grade_level_id,
      adviser: adviser || null,

      // Keep the full schedule information for the frontend
      schedules: studentSchedules.map((schedule) => ({
        scheduleId: schedule.schedule_id,
        subject: schedule.subject_name,
        day: schedule.day_name,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        room: schedule.room_name,
        teacher: [
          schedule.teacher_first_name,
          schedule.teacher_middle_name,
          schedule.teacher_last_name,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    };
  });
};

const r = await getParentDashboardStudents(240001);
console.log(r);

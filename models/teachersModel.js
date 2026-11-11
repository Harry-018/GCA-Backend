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

export const getAssignedSectionForTeacher = async (user_id) => {
  return await db
    .selectFrom("teacher_info as ti")
    .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
    .innerJoin("section_names as sn", "sn.section_name_id", "s.section_name_id")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "sygl.sy_grade_level_id",
      "s.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sy.school_year_id", "sygl.school_year_id")
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "sygl.grade_level_id")

    // ENROLLMENT
    .leftJoin("enrollment as e", "e.section_id", "s.section_id")

    // STUDENT INFORMATION CHAIN
    .leftJoin("students as st", "st.stu_id", "e.stu_id")
    .leftJoin("submissions as sub", "st.submission_id", "sub.submission_id")
    .leftJoin("app_approval as aa", "sub.app_approval_id", "aa.app_approval_id")
    .leftJoin("applications as a", "aa.application_id", "a.application_id")
    .leftJoin(
      "applicant_info as ai",
      "a.applicant_info_id",
      "ai.applicant_info_id",
    )

    .select([
      // SECTION
      "s.section_id",
      "s.section_name_id",
      "sn.section_name",
      "s.section_name_version_id",
      "s.sy_grade_level_id",
      "s.adviser_teacher_id",

      // SCHOOL YEAR
      "sy.school_year_id",
      sql`CONCAT(YEAR(sy.start_date), ' - ', YEAR(sy.end_date))`.as("ay"),

      // GRADE LEVEL
      "gl.grade_level_id",
      "gl.grade_level_name",

      // ENROLLMENT
      "e.enrollment_id",
      "e.enr_status",

      // STUDENT
      "st.stu_id",
      "st.stu_num",
      "st.lrn",
      "st.stu_status",

      // STUDENT PERSONAL INFORMATION
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "ai.bdate",
      "ai.gender",

      sql`TIMESTAMPDIFF(YEAR, ai.bdate, CURDATE())`.as("age"),

      // SCHOOL YEAR
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
      sql`CONCAT(YEAR(sy.start_date), ' - ', YEAR(sy.end_date))`.as("ay"),
    ])
    .where("ti.user_id", "=", user_id)
    .where("sy.sy_status", "=", "active")
    .where("sygl.sy_gradelevel_status", "=", "active")
    .where("s.section_status", "=", "active")
    .where("sn.section_name_status", "=", "active")
    .where((eb) =>
      eb.or([
        eb("e.enr_status", "=", "enrolled"),
        eb("e.enrollment_id", "is", null),
      ]),
    )
    .execute();
};

export const getAttendanceStudents = async (
  user_id,
  section_id,
  attendance_date,
) => {
  return await db
    .selectFrom("teacher_info as ti")
    .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "sygl.sy_grade_level_id",
      "s.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sy.school_year_id", "sygl.school_year_id")
    .innerJoin("enrollment as e", "e.section_id", "s.section_id")
    .innerJoin("students as st", "st.stu_id", "e.stu_id")
    .innerJoin("submissions as sub", "st.submission_id", "sub.submission_id")
    .innerJoin(
      "app_approval as aa",
      "sub.app_approval_id",
      "aa.app_approval_id",
    )
    .innerJoin("applications as a", "aa.application_id", "a.application_id")
    .innerJoin(
      "applicant_info as ai",
      "a.applicant_info_id",
      "ai.applicant_info_id",
    )
    .leftJoin("attendance as att", (join) =>
      join
        .onRef("att.enrollment_id", "=", "e.enrollment_id")
        .on("att.attendance_date", "=", attendance_date),
    )
    .select([
      "e.enrollment_id",
      "st.stu_id",
      "st.stu_num",
      "st.lrn",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "ai.gender",
      "att.attendance_status",
    ])
    .where("ti.user_id", "=", user_id)
    .where("s.section_id", "=", section_id)
    .where("sy.sy_status", "=", "active")
    .where("sygl.sy_gradelevel_status", "=", "active")
    .where("s.section_status", "=", "active")
    .where("e.enr_status", "=", "enrolled")
    .execute();
};

export const saveAttendance = async (
  user_id,
  section_id,
  attendance_date,
  attendanceRecords,
) => {
  return await db.transaction().execute(async (trx) => {
    // Confirm that this section belongs to the authenticated teacher.
    const assignedSection = await trx
      .selectFrom("teacher_info as ti")
      .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
      .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "s.sy_grade_level_id",
      )
      .innerJoin(
        "school_years as sy",
        "sy.school_year_id",
        "sygl.school_year_id",
      )
      .select("s.section_id")
      .where("ti.user_id", "=", user_id)
      .where("s.section_id", "=", section_id)
      .where("sy.sy_status", "=", "active")
      .where("sygl.sy_gradelevel_status", "=", "active")
      .where("s.section_status", "=", "active")
      .executeTakeFirst();

    if (!assignedSection) {
      const error = new Error(
        "You are not authorized to record attendance for this section.",
      );
      error.statusCode = 403;
      throw error;
    }

    // Confirm that every submitted enrollment belongs to this section
    // and is currently enrolled.
    const enrollmentIds = [
      ...new Set(
        attendanceRecords.map((record) => Number(record.enrollment_id)),
      ),
    ];

    const validEnrollments = await trx
      .selectFrom("enrollment")
      .select("enrollment_id")
      .where("section_id", "=", section_id)
      .where("enr_status", "=", "enrolled")
      .where("enrollment_id", "in", enrollmentIds)
      .execute();

    const validEnrollmentIds = new Set(
      validEnrollments.map((record) => Number(record.enrollment_id)),
    );

    const hasInvalidEnrollment = enrollmentIds.some(
      (enrollment_id) => !validEnrollmentIds.has(enrollment_id),
    );

    if (hasInvalidEnrollment) {
      const error = new Error(
        "One or more enrollment records do not belong to this section or are not enrolled.",
      );
      error.statusCode = 400;
      throw error;
    }

    // Insert new records or update the existing record for the same
    // enrollment_id and attendance_date.
    const recordsToSave = attendanceRecords.map((record) => ({
      enrollment_id: Number(record.enrollment_id),
      attendance_date,
      attendance_status: record.attendance_status,
    }));

    return await trx
      .insertInto("attendance")
      .values(recordsToSave)
      .onDuplicateKeyUpdate({
        attendance_status: sql`VALUES(attendance_status)`,
      })
      .execute();
  });
};

export const getMonthlyAttendanceReport = async (
  user_id,
  section_id,
  month,
  year,
) => {
  // Normalize input values.
  section_id = Number(section_id);
  month = Number(month);
  year = Number(year);

  if (
    !Number.isInteger(section_id) ||
    section_id <= 0 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    const error = new Error("Invalid section, month, or year.");
    error.statusCode = 400;
    throw error;
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

  // Calculate the first day of the following month.
  const endDateObj = new Date(year, month, 1);

  const endDate = [
    endDateObj.getFullYear(),
    String(endDateObj.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");

  // Verify that the teacher is assigned to this section.
  const assignedSection = await db
    .selectFrom("teacher_info as ti")
    .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
    .select("s.section_id")
    .where("ti.user_id", "=", user_id)
    .where("s.section_id", "=", section_id)
    .executeTakeFirst();

  if (!assignedSection) {
    const error = new Error(
      "You are not authorized to view this section's attendance report.",
    );
    error.statusCode = 403;
    throw error;
  }

  // Get students whose enrollment began before the selected month ended.
  // Historical enrollment statuses are included.
  const students = await db
    .selectFrom("enrollment as e")
    .innerJoin("students as st", "st.stu_id", "e.stu_id")
    .innerJoin("submissions as sub", "st.submission_id", "sub.submission_id")
    .innerJoin(
      "app_approval as aa",
      "sub.app_approval_id",
      "aa.app_approval_id",
    )
    .innerJoin("applications as a", "aa.application_id", "a.application_id")
    .innerJoin(
      "applicant_info as ai",
      "a.applicant_info_id",
      "ai.applicant_info_id",
    )
    .select([
      "e.enrollment_id",
      "st.stu_id",
      "st.stu_num",
      "st.lrn",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "ai.gender",
    ])
    .where("e.section_id", "=", section_id)
    .where("e.date_enrolled", "<", endDate)
    .execute();

  // Get attendance records for the selected month.
  const attendanceRows = await db
    .selectFrom("attendance as att")
    .innerJoin("enrollment as e", "e.enrollment_id", "att.enrollment_id")
    .select([
      "att.enrollment_id",
      "att.attendance_date",
      "att.attendance_status",
    ])
    .where("e.section_id", "=", section_id)
    .where("att.attendance_date", ">=", startDate)
    .where("att.attendance_date", "<", endDate)
    .execute();

  const attendanceMap = new Map();

  for (const row of attendanceRows) {
    const date =
      row.attendance_date instanceof Date
        ? [
            row.attendance_date.getFullYear(),
            String(row.attendance_date.getMonth() + 1).padStart(2, "0"),
            String(row.attendance_date.getDate()).padStart(2, "0"),
          ].join("-")
        : String(row.attendance_date).slice(0, 10);

    attendanceMap.set(`${row.enrollment_id}-${date}`, row.attendance_status);
  }

  // Generate dates only up to today for the current month.
  const daysInMonth = new Date(year, month, 0).getDate();

  const today = new Date();

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;

  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  const dates = [];

  for (let day = 1; day <= lastDay; day++) {
    dates.push(
      [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join(
        "-",
      ),
    );
  }

  // Calculate attendance summaries using only the displayed dates.
  const reportStudents = students.map((student) => {
    const attendance = {};
    let presentCount = 0;
    let absentCount = 0;

    for (const date of dates) {
      const status =
        attendanceMap.get(`${student.enrollment_id}-${date}`) ?? null;

      attendance[date] = status;

      if (status === "present") presentCount++;
      if (status === "absent") absentCount++;
    }

    return {
      ...student,
      attendance,
      present_count: presentCount,
      absent_count: absentCount,
    };
  });

  return {
    section_id: assignedSection.section_id,
    month,
    year,
    dates,
    students: reportStudents,
  };
};

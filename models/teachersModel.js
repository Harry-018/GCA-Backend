import db from "../config/db.js";
import { sql } from "kysely";
import { logAdminActivity } from "./activityLogsModel.js";

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

export const updateTeacher = async (teacher_id, data, user_id) => {
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

  const teacher = await db
    .selectFrom("teachers")
    .select("teacher_num")
    .where("teacher_id", "=", teacher_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Teachers",
    description: `Updated teacher ${teacher?.teacher_num ?? "N/A"} (Status: ${data.teacher_status}).`,
  });

  return {
    teacher_id,
    teacher_status: data.teacher_status,
  };
};

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
    .select(["t.teacher_id", "ti.teacher_info_id", "t.teacher_num"])
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

  await logAdminActivity({
    user_id: data.user_id,
    user_action: "Updated",
    user_module: "Teachers",
    description: `Updated teacher information (Teacher: ${teacher.teacher_num}).`,
  });

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

    const result = await trx
      .insertInto("attendance")
      .values(recordsToSave)
      .onDuplicateKeyUpdate({
        attendance_status: sql`VALUES(attendance_status)`,
      })
      .execute();

    const sectionInfo = await trx
      .selectFrom("sections as s")
      .innerJoin("section_names as sn", "s.section_name_id", "sn.section_name_id")
      .select("sn.section_name")
      .where("s.section_id", "=", section_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Teachers",
        description: `Saved attendance for ${sectionInfo?.section_name ?? "section"} on ${attendance_date} (${recordsToSave.length} record(s)).`,
      },
      trx,
    );

    return result;
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

// Get students, skills, and existing grades for the CSV template
export const getStudentGradesOfSection = async (
  user_id,
  section_id,
  subject_id,
  quarter_id,
) => {
  // 1. Verify that the teacher is the section adviser
  const section = await db
    .selectFrom("teacher_info as ti")
    .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
    .select(["s.section_id", "s.sy_grade_level_id", "s.adviser_teacher_id"])
    .where("ti.user_id", "=", Number(user_id))
    .where("s.section_id", "=", Number(section_id))
    .where("s.section_status", "=", "active")
    .executeTakeFirst();

  if (!section) {
    throw new Error("Section not found or you are not its adviser.");
  }

  // 2. Verify that the subject is assigned to the section's grade level
  const subject = await db
    .selectFrom("schoolyears_gradelevels_subjects as sgs")
    .innerJoin("subjects as sub", "sub.subject_id", "sgs.subject_id")
    .select([
      "sgs.sy_gradelevel_subject_id",
      "sgs.subject_id",
      "sub.subject_name",
    ])
    .where("sgs.sy_grade_level_id", "=", section.sy_grade_level_id)
    .where("sgs.subject_id", "=", Number(subject_id))
    .where("sgs.sy_gradelevel_subject_status", "=", "active")
    .executeTakeFirst();

  if (!subject) {
    throw new Error("Subject is not assigned to this section's grade level.");
  }

  // 3. Verify that the quarter is configured for this subject
  const quarter = await db
    .selectFrom("quarter_subjects as qs")
    .innerJoin("quarter as q", "q.quarter_id", "qs.quarter_id")
    .select(["q.quarter_id", "q.quarter_name"])
    .where("qs.sy_gradelevel_subject_id", "=", subject.sy_gradelevel_subject_id)
    .where("qs.quarter_id", "=", Number(quarter_id))
    .executeTakeFirst();

  if (!quarter) {
    throw new Error("Quarter is not configured for this subject.");
  }

  // 4. Retrieve active skills assigned to this subject
  const skills = await db
    .selectFrom("schoolyears_gradelevels_subjects_skills as sgss")
    .innerJoin("skill as sk", "sk.skill_id", "sgss.skill_id")
    .select(["sk.skill_id", "sk.skill_name"])
    .where(
      "sgss.sy_gradelevel_subject_id",
      "=",
      subject.sy_gradelevel_subject_id,
    )
    .where("sgss.skill_status", "=", "active")
    .where("sk.skill_status", "=", "active")
    .orderBy("sk.skill_name", "asc")
    .execute();

  if (skills.length === 0) {
    throw new Error("No active skills are assigned to this subject.");
  }

  // 5. Retrieve currently enrolled students in the selected section
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
      "e.stu_id",
      "st.stu_num",
      "st.lrn",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
    ])
    .where("e.section_id", "=", Number(section_id))
    .where("e.sy_grade_level_id", "=", section.sy_grade_level_id)
    .where("e.enr_status", "=", "enrolled")
    .where("st.stu_status", "=", "active")
    .orderBy("ai.last_name", "asc")
    .orderBy("ai.first_name", "asc")
    .execute();

  // 6. Retrieve existing grades for these students and skills
  const enrollmentIds = students.map((student) => student.enrollment_id);

  const skillIds = skills.map((skill) => skill.skill_id);

  let existingGrades = [];

  if (enrollmentIds.length > 0 && skillIds.length > 0) {
    existingGrades = await db
      .selectFrom("student_grades")
      .select([
        "enrollment_id",
        "skill_id",
        "quarter_id",
        "grade",
        "date_recorded",
      ])
      .where("quarter_id", "=", Number(quarter_id))
      .where("enrollment_id", "in", enrollmentIds)
      .where("skill_id", "in", skillIds)
      .execute();
  }

  // 7. Return the template data
  return {
    section_id: Number(section_id),
    subject: {
      subject_id: Number(subject.subject_id),
      subject_name: subject.subject_name,
      sy_gradelevel_subject_id: subject.sy_gradelevel_subject_id,
    },
    quarter,
    skills,
    students: students.map((student) => ({
      enrollment_id: student.enrollment_id,
      stu_id: student.stu_id,
      stu_num: student.stu_num,
      lrn: student.lrn,

      student_name: [student.last_name, student.first_name, student.middle_name]
        .filter(Boolean)
        .join(", "),

      grades: existingGrades
        .filter((grade) => grade.enrollment_id === student.enrollment_id)
        .map((grade) => ({
          skill_id: grade.skill_id,
          grade: grade.grade,
          date_recorded: grade.date_recorded,
        })),
    })),
  };
};

// Upload grades to students
export const uploadGradesToStudents = async (
  user_id,
  section_id,
  subject_id,
  quarter_id,
  grades,
) => {
  // 1. Retrieve and validate the section
  const section = await db
    .selectFrom("teacher_info as ti")
    .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
    .select(["s.section_id", "s.sy_grade_level_id", "s.adviser_teacher_id"])
    .where("ti.user_id", "=", Number(user_id))
    .where("s.section_id", "=", Number(section_id))
    .where("s.section_status", "=", "active")
    .executeTakeFirst();

  if (!section) {
    throw new Error("Section not found or you are not its adviser.");
  }

  // 2. Verify subject assignment
  const subject = await db
    .selectFrom("schoolyears_gradelevels_subjects")
    .select("sy_gradelevel_subject_id")
    .where("sy_grade_level_id", "=", section.sy_grade_level_id)
    .where("subject_id", "=", Number(subject_id))
    .where("sy_gradelevel_subject_status", "=", "active")
    .executeTakeFirst();

  if (!subject) {
    throw new Error("Invalid subject for this section.");
  }

  // 3. Verify quarter configuration
  const quarter = await db
    .selectFrom("quarter_subjects")
    .select("quarter_subject_id")
    .where("sy_gradelevel_subject_id", "=", subject.sy_gradelevel_subject_id)
    .where("quarter_id", "=", Number(quarter_id))
    .executeTakeFirst();

  if (!quarter) {
    throw new Error("Invalid quarter for this subject.");
  }

  // 4. Retrieve valid skills
  const skills = await db
    .selectFrom("schoolyears_gradelevels_subjects_skills as sgss")
    .innerJoin("skill as sk", "sk.skill_id", "sgss.skill_id")
    .select("sk.skill_id")
    .where(
      "sgss.sy_gradelevel_subject_id",
      "=",
      subject.sy_gradelevel_subject_id,
    )
    .where("sgss.skill_status", "=", "active")
    .where("sk.skill_status", "=", "active")
    .execute();

  const validSkillIds = new Set(skills.map((skill) => Number(skill.skill_id)));

  // 5. Retrieve valid enrolled students
  const enrolledStudents = await db
    .selectFrom("enrollment")
    .select("enrollment_id")
    .where("section_id", "=", Number(section_id))
    .where("sy_grade_level_id", "=", section.sy_grade_level_id)
    .where("enr_status", "=", "enrolled")
    .execute();

  const validEnrollmentIds = new Set(
    enrolledStudents.map((student) => Number(student.enrollment_id)),
  );

  // 6. Validate uploaded JSON
  if (!Array.isArray(grades) || grades.length === 0) {
    throw new Error("No grades were provided.");
  }

  const records = [];
  const seen = new Set();

  for (const student of grades) {
    const enrollmentId = Number(student.enrollment_id);

    if (!validEnrollmentIds.has(enrollmentId)) {
      throw new Error(`Invalid enrollment ID: ${student.enrollment_id}`);
    }

    if (!Array.isArray(student.grades)) {
      throw new Error(`Invalid grades format for enrollment ${enrollmentId}.`);
    }

    for (const item of student.grades) {
      const skillId = Number(item.skill_id);
      const grade = String(item.grade ?? "")
        .trim()
        .toLowerCase();

      if (!validSkillIds.has(skillId)) {
        throw new Error(`Invalid skill ID: ${item.skill_id}`);
      }

      if (!["a", "b", "c", "d", "e"].includes(grade)) {
        throw new Error(
          `Invalid grade "${item.grade}" for enrollment ${enrollmentId}.`,
        );
      }

      const key = `${enrollmentId}-${skillId}`;

      if (seen.has(key)) {
        throw new Error(
          `Duplicate grade entry for enrollment ${enrollmentId} and skill ${skillId}.`,
        );
      }

      seen.add(key);

      records.push({
        enrollment_id: enrollmentId,
        skill_id: skillId,
        quarter_id: Number(quarter_id),
        grade,
        date_recorded: sql`CURRENT_DATE`,
      });
    }
  }

  // 7. Save all grades in one transaction
  return await db.transaction().execute(async (trx) => {
    for (const record of records) {
      await trx
        .insertInto("student_grades")
        .values(record)
        .onDuplicateKeyUpdate({
          grade: record.grade,
          date_recorded: sql`CURRENT_DATE`,
        })
        .execute();
    }

    const sectionInfo = await trx
      .selectFrom("sections as s")
      .innerJoin("section_names as sn", "s.section_name_id", "sn.section_name_id")
      .select("sn.section_name")
      .where("s.section_id", "=", Number(section_id))
      .executeTakeFirst();

    const subjectInfo = await trx
      .selectFrom("subjects")
      .select("subject_name")
      .where("subject_id", "=", Number(subject_id))
      .executeTakeFirst();

    const quarterInfo = await trx
      .selectFrom("quarter")
      .select("quarter_name")
      .where("quarter_id", "=", Number(quarter_id))
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Teachers",
        description: `Updated ${records.length} student grade(s) for ${sectionInfo?.section_name ?? "section"}, ${subjectInfo?.subject_name ?? "subject"}, and ${quarterInfo?.quarter_name ?? "quarter"}.`,
      },
      trx,
    );

    return {
      uploaded_count: records.length,
      message: "Student grades uploaded successfully.",
    };
  });
};

// GET available quarters for the logged-in teacher
export const getTeacherGradingQuarters = async (user_id) => {
  return await db
    .selectFrom("quarter as q")
    .innerJoin("quarter_subjects as qs", "qs.quarter_id", "q.quarter_id")
    .innerJoin(
      "schoolyears_gradelevels_subjects as sgs",
      "sgs.sy_gradelevel_subject_id",
      "qs.sy_gradelevel_subject_id",
    )
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "sygl.sy_grade_level_id",
      "sgs.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sy.school_year_id", "sygl.school_year_id")
    .innerJoin("sections as s", "s.sy_grade_level_id", "sygl.sy_grade_level_id")
    .innerJoin("teachers as t", "t.teacher_id", "s.adviser_teacher_id")
    .innerJoin("teacher_info as ti", "ti.teacher_info_id", "t.teacher_info_id")
    .where("ti.user_id", "=", user_id)
    .where("s.section_status", "=", "active")
    .where("sygl.sy_gradelevel_status", "=", "active")
    .where("sgs.sy_gradelevel_subject_status", "=", "active")
    .where("sy.sy_status", "=", "active")
    .select(["q.quarter_id", "q.quarter_name"])
    .distinct()
    .orderBy("q.quarter_id")
    .execute();
};

// GET subjects available for the selected quarter
export const getTeacherGradingSubjects = async (user_id, quarter_id) => {
  return await db
    .selectFrom("quarter_subjects as qs")
    .innerJoin("quarter as q", "q.quarter_id", "qs.quarter_id")
    .innerJoin(
      "schoolyears_gradelevels_subjects as sgs",
      "sgs.sy_gradelevel_subject_id",
      "qs.sy_gradelevel_subject_id",
    )
    .innerJoin("subjects as sub", "sub.subject_id", "sgs.subject_id")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "sygl.sy_grade_level_id",
      "sgs.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sy.school_year_id", "sygl.school_year_id")
    .innerJoin("sections as s", "s.sy_grade_level_id", "sygl.sy_grade_level_id")
    .innerJoin("teachers as t", "t.teacher_id", "s.adviser_teacher_id")
    .innerJoin("teacher_info as ti", "ti.teacher_info_id", "t.teacher_info_id")
    .where("ti.user_id", "=", user_id)
    .where("q.quarter_id", "=", quarter_id)
    .where("s.section_status", "=", "active")
    .where("sygl.sy_gradelevel_status", "=", "active")
    .where("sgs.sy_gradelevel_subject_status", "=", "active")
    .where("sy.sy_status", "=", "active")
    .select(["sub.subject_id", "sub.subject_name"])
    .distinct()
    .orderBy("sub.subject_name")
    .execute();
};

export const uploadQuarterlyRemarks = async (
  user_id,
  section_id,
  quarter_id,
  remarks,
) => {
  // 1. Validate the teacher and section ownership
  const teacherSection = await db
    .selectFrom("teacher_info as ti")
    .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
    .select(["t.teacher_id", "s.section_id"])
    .where("ti.user_id", "=", user_id)
    .where("s.section_id", "=", section_id)
    .where("s.section_status", "=", "active")
    .executeTakeFirst();

  if (!teacherSection) {
    throw new Error(
      "You are not authorized to upload remarks for this section.",
    );
  }

  const teacher_id = Number(teacherSection.teacher_id);

  // 2. Validate quarter
  const quarter = await db
    .selectFrom("quarter")
    .select(["quarter_id", "quarter_name"])
    .where("quarter_id", "=", quarter_id)
    .executeTakeFirst();

  if (!quarter) {
    throw new Error("Invalid grading quarter.");
  }

  // 3. Validate remarks
  if (!Array.isArray(remarks) || remarks.length === 0) {
    throw new Error("No remarks were provided.");
  }

  const remarkMap = new Map();

  for (const item of remarks) {
    const enrollment_id = Number(item.enrollment_id);
    const comment = String(item.comment ?? "").trim();

    if (!Number.isInteger(enrollment_id) || enrollment_id <= 0) {
      throw new Error("Invalid enrollment ID in the uploaded remarks.");
    }

    if (remarkMap.has(enrollment_id)) {
      throw new Error(
        `Duplicate remark entry for enrollment ID ${enrollment_id}.`,
      );
    }

    // Ignore blank remarks
    if (!comment) continue;

    if (comment.length > 255) {
      throw new Error(
        `Remark for enrollment ID ${enrollment_id} exceeds 255 characters.`,
      );
    }

    remarkMap.set(enrollment_id, comment);
  }

  if (remarkMap.size === 0) {
    throw new Error("No valid remarks were provided.");
  }

  const enrollmentIds = [...remarkMap.keys()];

  // 4. Verify that all students belong to this section
  const validEnrollments = await db
    .selectFrom("enrollment as e")
    .innerJoin("students as st", "st.stu_id", "e.stu_id")
    .select("e.enrollment_id")
    .where("e.section_id", "=", section_id)
    .where("e.enr_status", "=", "enrolled")
    .where("st.stu_status", "=", "active")
    .where("e.enrollment_id", "in", enrollmentIds)
    .execute();

  if (validEnrollments.length !== enrollmentIds.length) {
    throw new Error(
      "One or more students are not currently enrolled in this section.",
    );
  }

  // 5. Insert or update remarks
  await db.transaction().execute(async (trx) => {
    for (const [enrollment_id, comment] of remarkMap) {
      await trx
        .insertInto("quarterly_remarks")
        .values({
          enrollment_id,
          quarter_id,
          comment,
          recorded_by: teacher_id,
          date_recorded: sql`CURRENT_TIMESTAMP`,
        })
        .onDuplicateKeyUpdate({
          comment,
          recorded_by: teacher_id,
          date_recorded: sql`CURRENT_TIMESTAMP`,
        })
        .executeTakeFirst();
    }

    const sectionInfo = await trx
      .selectFrom("sections as s")
      .innerJoin("section_names as sn", "s.section_name_id", "sn.section_name_id")
      .select("sn.section_name")
      .where("s.section_id", "=", section_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Teachers",
        description: `Updated ${remarkMap.size} quarterly remark(s) for ${sectionInfo?.section_name ?? "section"} and ${quarter.quarter_name}.`,
      },
      trx,
    );
  });

  return {
    uploaded_count: remarkMap.size,
    message: "Quarterly remarks uploaded successfully.",
  };
};

export const getQuarterlyRemarksOfSection = async (
  user_id,
  section_id,
  quarter_id,
) => {
  // 1. Verify teacher ownership of the section
  const section = await db
    .selectFrom("teacher_info as ti")
    .innerJoin("teachers as t", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("sections as s", "s.adviser_teacher_id", "t.teacher_id")
    .select(["s.section_id", "s.section_name_id", "t.teacher_id"])
    .where("ti.user_id", "=", user_id)
    .where("s.section_id", "=", section_id)
    .where("s.section_status", "=", "active")
    .executeTakeFirst();

  if (!section) {
    throw new Error("You are not authorized to access this section.");
  }

  // 2. Verify quarter
  const quarter = await db
    .selectFrom("quarter")
    .select(["quarter_id", "quarter_name"])
    .where("quarter_id", "=", quarter_id)
    .executeTakeFirst();

  if (!quarter) {
    throw new Error("Invalid grading quarter.");
  }

  // 3. Fetch enrolled students and their remarks
  const students = await db
    .selectFrom("enrollment as e")
    .innerJoin("students as st", "st.stu_id", "e.stu_id")
    .innerJoin("submissions as sub", "sub.submission_id", "st.submission_id")
    .innerJoin(
      "app_approval as aa",
      "aa.app_approval_id",
      "sub.app_approval_id",
    )
    .innerJoin("applications as a", "a.application_id", "aa.application_id")
    .innerJoin(
      "applicant_info as ai",
      "ai.applicant_info_id",
      "a.applicant_info_id",
    )
    .leftJoin("quarterly_remarks as qr", (join) =>
      join
        .onRef("qr.enrollment_id", "=", "e.enrollment_id")
        .on("qr.quarter_id", "=", quarter_id),
    )
    .select([
      "e.enrollment_id",
      "st.stu_id",
      "st.stu_num",
      "st.lrn",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "qr.remark_id",
      "qr.comment",
      "qr.date_recorded",
    ])
    .where("e.section_id", "=", section_id)
    .where("e.enr_status", "=", "enrolled")
    .where("st.stu_status", "=", "active")
    .orderBy("ai.last_name", "asc")
    .orderBy("ai.first_name", "asc")
    .execute();

  return {
    section,
    quarter,
    remarks: students.map((student) => ({
      enrollment_id: student.enrollment_id,
      stu_id: student.stu_id,
      stu_num: student.stu_num,
      lrn: student.lrn,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      student_name: `${student.last_name}, ${student.first_name}${
        student.middle_name ? ` ${student.middle_name}` : ""
      }`,
      remark_id: student.remark_id,
      comment: student.comment ?? null,
      date_recorded: student.date_recorded,
    })),
  };
};

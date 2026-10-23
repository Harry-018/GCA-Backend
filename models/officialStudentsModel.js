import db from "../config/db.js";
import { sql } from "kysely";

export const getStudentSchoolYears = async () => {
  return await db
    .selectFrom("school_years")
    .select(["school_year_id", "start_date", "end_date", "sy_status"])
    .where("sy_status", "in", ["active", "archived"])
    .orderBy("start_date", "desc")
    .execute();
};

export const getStudents = async ({
  status = "all",
  search = "",
  page = 1,
  limit = 10,
  school_year_id,
}) => {
  const offset = (page - 1) * limit;
  const schoolYearId = Number(school_year_id);

  if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
    throw new Error("A valid school year ID is required.");
  }

  let query = db
    .selectFrom("students as s")

    // APPLICATION CHAIN
    .innerJoin("submissions as sub", "s.submission_id", "sub.submission_id")
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

    // PAYMENT OPTION
    .innerJoin(
      "gradelevel_paymentoptions as gpo",
      "a.gradelevel_paymentoption_id",
      "gpo.gradelevel_paymentoption_id",
    )
    .innerJoin(
      "payment_option as po",
      "gpo.payment_option_id",
      "po.payment_option_id",
    )

    // SELECTED SCHOOL YEAR ENROLLMENT
    .innerJoin("enrollment as e", "s.stu_id", "e.stu_id")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "e.sy_grade_level_id",
      "sygl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sygl.school_year_id", "sy.school_year_id")

    // CURRENT GRADE LEVEL
    .leftJoin(
      "grade_levels as gl",
      "s.current_grade_level_id",
      "gl.grade_level_id",
    )

    .where("sy.school_year_id", "=", schoolYearId)
    .distinct()
    .select([
      "s.stu_id",
      "s.stu_num",
      "s.lrn",
      "s.stu_status",

      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",

      "gl.grade_level_name",

      "po.option_name",
    ]);

  // STUDENT STATUS
  if (status && status !== "all") {
    query = query.where("s.stu_status", "=", status);
  }

  // SEARCH
  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;

    query = query.where((eb) =>
      eb.or([
        sql`LOWER(${sql.ref("ai.first_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ai.middle_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ai.last_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("s.stu_num")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("s.lrn")}) LIKE ${term}`,
      ]),
    );
  }

  // COUNT DISTINCT STUDENTS MATCHING THE FILTERS
  const countResult = await query
    .clearSelect()
    .clearOrderBy()
    .select(sql`COUNT(DISTINCT ${sql.ref("s.stu_id")})`.as("total"))
    .executeTakeFirst();

  const total = Number(countResult?.total ?? 0);

  // PAGINATED STUDENT DATA
  const students = await query
    .orderBy("ai.last_name", "asc")
    .orderBy("ai.first_name", "asc")
    .limit(limit)
    .offset(offset)
    .execute();

  return {
    data: students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getStudentInfo = async (stu_id) => {
  return await db
    .selectFrom("students as s")

    // APPLICATION CHAIN
    .innerJoin("submissions as sub", "s.submission_id", "sub.submission_id")
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

    // ADDRESS
    .leftJoin("applicant_address as addr", "ai.address_id", "addr.address_id")

    // PAYMENT OPTION
    .innerJoin(
      "gradelevel_paymentoptions as gpo",
      "a.gradelevel_paymentoption_id",
      "gpo.gradelevel_paymentoption_id",
    )
    .innerJoin(
      "payment_option as po",
      "gpo.payment_option_id",
      "po.payment_option_id",
    )

    // ENROLLMENT
    .leftJoin("enrollment as e", "s.stu_id", "e.stu_id")
    .leftJoin("sections as sec", "e.section_id", "sec.section_id")
    .leftJoin(
      "schoolyears_gradelevels as sgl",
      "sec.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .leftJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .leftJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .leftJoin(
      "section_names as sn",
      "sec.section_name_id",
      "sn.section_name_id",
    )

    .select([
      // STUDENT
      "s.stu_id",
      "s.stu_num",
      "s.lrn",
      "s.stu_status",

      // APPLICANT INFORMATION
      "ai.applicant_info_id",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "ai.gender",
      "ai.bdate",
      "ai.birthplace",
      "ai.religion",
      "ai.nationality",
      "ai.disabled",
      "ai.disability",
      "ai.address_id",

      // ADDRESS
      "addr.province",
      "addr.city_municipality",
      "addr.barangay",
      "addr.house_no",
      "addr.zipcode",

      // APPLICATION PAYMENT OPTION
      "po.option_name",

      // CURRENT ENROLLMENT
      "e.enrollment_id",
      "e.enr_status",
      "e.date_enrolled",

      // CURRENT ACADEMIC PLACEMENT
      "gl.grade_level_name",
      "sn.section_name",

      // SCHOOL YEAR
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
    ])

    .where("s.stu_id", "=", stu_id)

    .executeTakeFirst();
};

export const editStudent = async (stu_id, data) => {
  const allowedStatuses = ["active", "dropout", "transferred"];

  if (!allowedStatuses.includes(data.stu_status)) {
    throw new Error("Invalid student status.");
  }

  const result = await db
    .updateTable("students")
    .set({
      lrn: data.lrn,
      lrn: data.lrn || null,
      stu_status: data.stu_status,
    })
    .where("stu_id", "=", stu_id)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) !== 1) {
    throw new Error("Student not found.");
  }

  return {
    stu_id: Number(stu_id),
  };
};

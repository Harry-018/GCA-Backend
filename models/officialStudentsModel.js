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

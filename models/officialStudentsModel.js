import db from "../config/db.js";
import { sql } from "kysely";

export const getStudents = async ({
  status = "all",
  search = "",
  page = 1,
  limit = 10,
}) => {
  const offset = (page - 1) * limit;

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

    // CURRENT ENROLLMENT
    .leftJoin(
      "grade_levels as gl",
      "s.current_grade_level_id",
      "gl.grade_level_id",
    )

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

  // STATUS
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

  // COUNT
  const countQuery = query
    .clearSelect()
    .clearOrderBy()
    .select((eb) => eb.fn.count("s.stu_id").as("total"));

  const countResult = await countQuery.executeTakeFirst();

  const total = Number(countResult?.total ?? 0);

  // DATA
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
    // ENROLLMENT
    .leftJoin("enrollment as e", "s.stu_id", "e.stu_id")

    // SECTION
    .leftJoin("sections as sec", "e.section_id", "sec.section_id")

    // ENROLLMENT SCHOOL YEAR + GRADE LEVEL
    .leftJoin(
      "schoolyears_gradelevels as sgl",
      "e.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )

    .leftJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")

    // CURRENT STUDENT GRADE LEVEL
    .leftJoin(
      "grade_levels as current_gl",
      "s.current_grade_level_id",
      "current_gl.grade_level_id",
    )

    // SECTION GRADE LEVEL
    .leftJoin(
      "grade_levels as enrollment_gl",
      "sgl.grade_level_id",
      "enrollment_gl.grade_level_id",
    )
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
      "current_gl.grade_level_id as current_grade_level_id",
      "current_gl.grade_level_name as current_grade_level_name",

      "enrollment_gl.grade_level_id as enrollment_grade_level_id",
      "enrollment_gl.grade_level_name as enrollment_grade_level_name",
      "sn.section_name",

      // SCHOOL YEAR
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
    ])

    .where("s.stu_id", "=", stu_id)

    .executeTakeFirst();
};

export const getStudentEnrollments = async (stu_id) => {
  return await db
    .selectFrom("enrollment as e")

    // SCHOOL YEAR + GRADE LEVEL
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "e.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )

    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")

    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")

    // SECTION IS OPTIONAL
    .leftJoin("sections as sec", "e.section_id", "sec.section_id")

    .leftJoin(
      "section_names as sn",
      "sec.section_name_id",
      "sn.section_name_id",
    )

    .select([
      "e.enrollment_id",
      "e.stu_id",
      "e.enr_status",
      "e.date_enrolled",
      "e.promoted_by",

      "e.sy_grade_level_id",

      "sec.section_id",
      "sn.section_name",

      "gl.grade_level_id",
      "gl.grade_level_name",

      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
    ])

    .where("e.stu_id", "=", stu_id)

    .orderBy("sy.start_date", "desc")
    .execute();
};

export const editStudent = async (stu_id, data) => {
  const allowedStatuses = ["active", "dropout", "transferred"];

  if (!allowedStatuses.includes(data.stu_status)) {
    throw new Error("Invalid student status.");
  }

  const result = await db
    .updateTable("students")
    .set({
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

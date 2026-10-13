import { sql } from "kysely";
import db from "../config/db.js";

// Get school years available in the Dashboard filter
// Draft school years are excluded.
export const getDashboardSchoolYears = async () => {
  return await db
    .selectFrom("school_years")
    .select(["school_year_id", "start_date", "end_date", "sy_status"])
    .where("sy_status", "in", ["active", "archived"])
    .orderBy("start_date", "desc")
    .execute();
};

// Get Dashboard statistics for a selected school year
export const getDashboardStats = async (school_year_id) => {
  const schoolYearId = Number(school_year_id);

  // Validate school year ID
  if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
    throw new Error("A valid school year ID is required.");
  }

  // Confirm that the school year exists and is not a Draft
  const schoolYear = await db
    .selectFrom("school_years")
    .select("school_year_id")
    .where("school_year_id", "=", schoolYearId)
    .where("sy_status", "in", ["active", "archived"])
    .executeTakeFirst();

  if (!schoolYear) {
    throw new Error("Selected school year was not found or is unavailable.");
  }

  // Student statistics for the selected school year
  const studentStats = await db
    .selectFrom("enrollment as e")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "e.sy_grade_level_id",
      "sygl.sy_grade_level_id",
    )
    .innerJoin("students as s", "e.stu_id", "s.stu_id")
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
    .where("sygl.school_year_id", "=", schoolYearId)
    .where("s.stu_status", "=", "active")
    .where("e.enr_status", "in", ["enrolled", "promoted", "retained"])
    .select([
      sql`
        COUNT(DISTINCT ${sql.ref("s.stu_id")})
      `.as("totalStudents"),

      sql`
        COUNT(DISTINCT CASE
          WHEN LOWER(TRIM(${sql.ref("ai.gender")})) = 'male'
          THEN ${sql.ref("s.stu_id")}
        END)
      `.as("maleStudents"),

      sql`
        COUNT(DISTINCT CASE
          WHEN LOWER(TRIM(${sql.ref("ai.gender")})) = 'female'
          THEN ${sql.ref("s.stu_id")}
        END)
      `.as("femaleStudents"),

      sql`
        COUNT(DISTINCT CASE
          WHEN LOWER(TRIM(${sql.ref("ai.disabled")})) = 'yes'
          THEN ${sql.ref("s.stu_id")}
        END)
      `.as("disabledStudents"),
    ])
    .executeTakeFirst();

  // Payment statistics for the selected school year
  const paymentStats = await db
    .selectFrom("enrollment as e")
    .innerJoin(
      "schoolyears_gradelevels as sygl",
      "e.sy_grade_level_id",
      "sygl.sy_grade_level_id",
    )
    .innerJoin("students as s", "e.stu_id", "s.stu_id")
    .innerJoin("submissions as sub", "s.submission_id", "sub.submission_id")
    .innerJoin(
      "app_approval as aa",
      "sub.app_approval_id",
      "aa.app_approval_id",
    )
    .innerJoin("applications as a", "aa.application_id", "a.application_id")
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
    .where("sygl.school_year_id", "=", schoolYearId)
    .where("s.stu_status", "=", "active")
    .where("e.enr_status", "in", ["enrolled", "promoted", "retained"])
    .select([
      sql`
        COUNT(DISTINCT CASE
          WHEN LOWER(TRIM(${sql.ref("po.option_name")})) LIKE '%full cash%'
          THEN ${sql.ref("s.stu_id")}
        END)
      `.as("fullCashPayments"),

      sql`
        COUNT(DISTINCT CASE
          WHEN LOWER(TRIM(${sql.ref("po.option_name")})) LIKE '%pay lite%'
          THEN ${sql.ref("s.stu_id")}
        END)
      `.as("payLitePayments"),

      sql`
        COUNT(DISTINCT CASE
          WHEN LOWER(TRIM(${sql.ref("po.option_name")})) LIKE '%all in%'
          THEN ${sql.ref("s.stu_id")}
        END)
      `.as("allInPayments"),
    ])
    .executeTakeFirst();

  // Return numeric values, defaulting to zero when there are no matches
  return {
    school_year_id: schoolYearId,

    totalStudents: Number(studentStats?.totalStudents ?? 0),
    maleStudents: Number(studentStats?.maleStudents ?? 0),
    femaleStudents: Number(studentStats?.femaleStudents ?? 0),
    disabledStudents: Number(studentStats?.disabledStudents ?? 0),

    fullCashPayments: Number(paymentStats?.fullCashPayments ?? 0),
    payLitePayments: Number(paymentStats?.payLitePayments ?? 0),
    allInPayments: Number(paymentStats?.allInPayments ?? 0),
  };
};

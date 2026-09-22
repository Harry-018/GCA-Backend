import db from "../config/db.js";
import { sql } from "kysely";

export const getParents = async () => {
  return await db
    .selectFrom("parent_info as p")
    .leftJoin("applicant_parent as ap", "p.parent_info_id", "ap.parent_info_id")
    .leftJoin("applications as a", "ap.application_id", "a.application_id")
    .leftJoin("app_approval as aa", "a.application_id", "aa.application_id")
    .leftJoin("submissions as sub", "aa.app_approval_id", "sub.app_approval_id")
    .leftJoin("students as s", "sub.submission_id", "s.submission_id")
    .leftJoin("enrollment as e", "s.stu_id", "e.stu_id")
    .leftJoin("sections as sec", "e.section_id", "sec.section_id")
    .leftJoin(
      "schoolyears_gradelevels as sgl",
      "sec.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .leftJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .select([
      "p.parent_info_id",
      "p.first_name",
      "p.middle_name",
      "p.last_name",
      "p.contact_number",
      "p.occupation",
      "p.email",
      "p.user_id",

      sql`COUNT(DISTINCT CASE
        WHEN sy.sy_status = 'active'
        THEN s.stu_id
      END)`.as("enrolled_children"),
    ])
    .groupBy([
      "p.parent_info_id",
      "p.first_name",
      "p.middle_name",
      "p.last_name",
      "p.contact_number",
      "p.occupation",
      "p.email",
      "p.user_id",
    ])
    .execute();
};

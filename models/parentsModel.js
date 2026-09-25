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
    .innerJoin("enrollment as e", "s.stu_id", "e.stu_id")
    .innerJoin("sections as sec", "e.section_id", "sec.section_id")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "sec.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .where("ap.will_receive_account", "=", true)
    .where("sy.sy_status", "=", "active");
};

export const getParents = async ({ search = "", page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  /*
   * Main parent query
   */
  let query = buildParentQuery()
    .select(["p.parent_info_id", "p.last_name", "p.first_name", "p.email"])
    .select(sql`COUNT(DISTINCT ${sql.ref("s.stu_id")})`.as("enrolled_children"))
    .groupBy(["p.parent_info_id", "p.last_name", "p.first_name", "p.email"]);

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

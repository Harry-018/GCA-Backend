import db from "../config/db.js";

export const getStudents = async (status) => {
  let query = db
    .selectFrom("students as s")
    .innerJoin("enrollment as e", "s.stu_id", "e.stu_id")
    .innerJoin("sections as sec", "e.section_id", "sec.section_id")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "sec.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .innerJoin(
      "section_names as sn",
      "sec.section_name_id",
      "sn.section_name_id",
    )
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
    .select([
      "s.stu_id",
      "s.stu_num",
      "s.lrn",
      "s.stu_status",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "gl.grade_level_name",
      "sn.section_name",
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
      "e.enr_status",
      "e.date_enrolled",
    ])
    .where("sy.sy_status", "=", "active");

  if (status && status !== "all") {
    query = query.where("s.stu_status", "=", status);
  }

  return await query.execute();
};

export const getStudentInfo = async (stu_id) => {
  return await db
    .selectFrom("students as s")
    .innerJoin("enrollment as e", "s.stu_id", "e.stu_id")
    .innerJoin("sections as sec", "e.section_id", "sec.section_id")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "sec.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .innerJoin(
      "section_names as sn",
      "sec.section_name_id",
      "sn.section_name_id",
    )
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
    .select([
      "s.stu_id",
      "s.stu_num",
      "s.lrn",
      "s.stu_status",

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

      "gl.grade_level_name",
      "sn.section_name",

      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",

      "e.enrollment_id",
      "e.enr_status",
      "e.date_enrolled",
    ])
    .where("s.stu_id", "=", stu_id)
    .where("sy.sy_status", "=", "active")
    .executeTakeFirst();
};

export const getStudentEnrollments = async (stu_id) => {
  return await db
    .selectFrom("enrollment as e")
    .innerJoin("sections as sec", "e.section_id", "sec.section_id")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "sec.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .innerJoin(
      "section_names as sn",
      "sec.section_name_id",
      "sn.section_name_id",
    )
    .select([
      "e.enrollment_id",
      "e.stu_id",
      "e.enr_status",
      "e.date_enrolled",

      "sec.section_id",
      "sn.section_name",

      "gl.grade_level_id",
      "gl.grade_level_name",

      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",

      "e.promoted_by",
    ])
    .where("e.stu_id", "=", stu_id)
    .orderBy("sy.start_date", "desc")
    .execute();
};

export const editStudent = async (stu_id, data) => {
  const result = await db
    .updateTable("students")
    .set({
      lrn: data.lrn,
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

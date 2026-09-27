import db from "../config/db.js";
//works
export const getSectionGradeLevels = async () => {
  return await db
    .selectFrom("schoolyears_gradelevels as sgl")
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .leftJoin("sections as s", "sgl.sy_grade_level_id", "s.sy_grade_level_id")
    .select([
      "sgl.sy_grade_level_id",
      "gl.grade_level_id",
      "gl.grade_level_name",
    ])
    .select(({ fn }) => [fn.count("s.section_id").as("section_count")])
    .where("sy.sy_status", "=", "active")
    .where("sgl.sy_gradelevel_status", "=", "active")
    .where((eb) =>
      eb.or([
        eb("s.section_status", "=", "active"),
        eb("s.section_id", "is", null),
      ]),
    )
    .groupBy([
      "sgl.sy_grade_level_id",
      "gl.grade_level_id",
      "gl.grade_level_name",
    ])
    .orderBy("gl.grade_level_id", "asc")
    .execute();
};
//works
export const getSectionsByGradeLevel = async (sy_grade_level_id) => {
  return await db
    .selectFrom("sections as s")
    .innerJoin("section_names as sn", "s.section_name_id", "sn.section_name_id")
    .innerJoin("teachers as t", "s.adviser_teacher_id", "t.teacher_id")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .select([
      "s.section_id",
      "s.section_name_id",
      "sn.section_name",
      "s.sy_grade_level_id",
      "s.adviser_teacher_id",
      "ti.first_name",
      "ti.last_name",
      "s.section_status",
    ])
    .where("s.sy_grade_level_id", "=", sy_grade_level_id)
    .orderBy("sn.section_name", "asc")
    .execute();
};
// works
export const getSectionDetails = async (section_id) => {
  const section = await db
    .selectFrom("sections as s")
    .innerJoin("section_names as sn", "s.section_name_id", "sn.section_name_id")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "s.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .innerJoin("teachers as t", "s.adviser_teacher_id", "t.teacher_id")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .select([
      "s.section_id",
      "sn.section_name",
      "s.sy_grade_level_id",
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
      "s.adviser_teacher_id",
      "ti.first_name",
      "ti.last_name",
      "s.section_status",
    ])
    .where("s.section_id", "=", section_id)
    .executeTakeFirst();

  if (!section) {
    throw new Error("Section not found.");
  }

  const enrollments = await db
    .selectFrom("enrollment as e")
    .innerJoin("students as st", "e.stu_id", "st.stu_id")
    .select([
      "e.enrollment_id",
      "e.stu_id",
      "st.stu_num",
      "st.lrn",
      "e.enr_status",
      "e.date_enrolled",
    ])
    .where("e.section_id", "=", section_id)
    .orderBy("e.date_enrolled", "asc")
    .execute();

  return {
    section,
    enrollments,
  };
};
// works
export const createSection = async (data) => {
  const result = await db
    .insertInto("sections")
    .values({
      section_name_id: data.section_name_id,
      sy_grade_level_id: data.sy_grade_level_id,
      adviser_teacher_id: data.adviser_teacher_id,
      section_status: "active",
    })
    .executeTakeFirst();

  return {
    section_id: Number(result.insertId),
  };
};
//works
export const editSection = async (section_id, data) => {
  const result = await db
    .updateTable("sections")
    .set({
      section_name_id: data.section_name_id,
      sy_grade_level_id: data.sy_grade_level_id,
      adviser_teacher_id: data.adviser_teacher_id,
    })
    .where("section_id", "=", section_id)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) !== 1) {
    throw new Error("Section not found.");
  }

  return {
    section_id: Number(section_id),
  };
};
//works
export const updateSectionStatus = async (section_id, status) => {
  const result = await db
    .updateTable("sections")
    .set({
      section_status: status,
    })
    .where("section_id", "=", section_id)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) !== 1) {
    throw new Error("Section not found.");
  }

  return {
    section_id: Number(section_id),
    section_status: status,
  };
};

const result = await getSectionsByGradeLevel(1);

console.log(result);

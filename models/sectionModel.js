import db from "../config/db.js";

import { sql } from "kysely";

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
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
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
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
    ])
    .orderBy("gl.grade_level_id", "asc")
    .execute();
};

export const getSectionsByGradeLevel = async (sy_grade_level_id) => {
  const sections = await db
    .selectFrom("sections as s")
    .innerJoin(
      "section_name_versions as snv",
      "s.section_name_version_id",
      "snv.section_name_version_id",
    )
    .leftJoin("teachers as t", "s.adviser_teacher_id", "t.teacher_id")
    .leftJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .select([
      "s.section_id",
      "s.section_name_id",
      "s.section_name_version_id",
      "snv.section_name",
      "s.sy_grade_level_id",
      "s.adviser_teacher_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "s.section_status",
    ])
    .where("s.sy_grade_level_id", "=", sy_grade_level_id)
    .where("s.section_status", "=", "active")
    .orderBy("snv.section_name", "asc")
    .execute();
  return sections.map((section) => ({
    ...section,
    adviser_name: section.adviser_teacher_id
      ? [section.first_name, section.middle_name, section.last_name]
          .filter(Boolean)
          .join(" ")
      : null,
  }));
};

export const getSectionDetails = async (section_id) => {
  const section = await db
    .selectFrom("sections as s")
    .innerJoin(
      "section_name_versions as snv",
      "s.section_name_version_id",
      "snv.section_name_version_id",
    )
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "s.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .leftJoin("teachers as t", "s.adviser_teacher_id", "t.teacher_id")
    .leftJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .select([
      "s.section_id",
      "s.section_name_id",
      "s.section_name_version_id",
      "snv.section_name",
      "s.sy_grade_level_id",
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sy.school_year_id",
      "sy.start_date",
      "sy.end_date",
      "s.adviser_teacher_id",
      "ti.first_name",
      "ti.middle_name",
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
      "e.enr_status",
      "e.date_enrolled",
    ])
    .where("e.section_id", "=", section_id)
    .where("e.enr_status", "=", "enrolled")
    .orderBy("e.date_enrolled", "asc")
    .execute();
  return {
    section: {
      ...section,
      adviser_name: section.adviser_teacher_id
        ? [section.first_name, section.middle_name, section.last_name]
            .filter(Boolean)
            .join(" ")
        : null,
    },
    enrollments,
  };
};

export const assignSection = async (data) => {
  const section_name_id = Number(data.section_name_id);
  const sy_grade_level_id = Number(data.sy_grade_level_id);
  const adviser_teacher_id = data.adviser_teacher_id
    ? Number(data.adviser_teacher_id)
    : null;
  if (!section_name_id) {
    throw new Error("Section name is required.");
  }
  if (!sy_grade_level_id) {
    throw new Error("Grade level is required.");
  }
  return await db.transaction().execute(async (trx) => {
    /* * 1. Check that the master section name exists * and is active. */ const sectionName =
      await trx
        .selectFrom("section_names as sn")
        .select([
          "sn.section_name_id",
          "sn.section_name",
          "sn.section_name_status",
        ])
        .where("sn.section_name_id", "=", section_name_id)
        .executeTakeFirst();
    if (!sectionName) {
      throw new Error("Section name not found.");
    }
    if (sectionName.section_name_status !== "active") {
      throw new Error("Section name is archived.");
    }
    /* * 2. Get the current version of the master * section name. */ const sectionNameVersion =
      await trx
        .selectFrom("section_name_versions as snv")
        .select(["snv.section_name_version_id", "snv.section_name"])
        .where("snv.section_name_id", "=", section_name_id)
        .where("snv.section_name", "=", sectionName.section_name)
        .executeTakeFirst();
    if (!sectionNameVersion) {
      throw new Error("Current section name version not found.");
    }
    /* * 3. Prevent duplicate ACTIVE assignments * for the same section name and grade level. */ const existingSection =
      await trx
        .selectFrom("sections")
        .select("section_id")
        .where("section_name_id", "=", section_name_id)
        .where("sy_grade_level_id", "=", sy_grade_level_id)
        .where("section_status", "=", "active")
        .executeTakeFirst();
    if (existingSection) {
      throw new Error(
        "This section name is already assigned to this grade level.",
      );
    }
    /* * 4. Validate adviser if one was provided. * * A section may exist without an adviser. */ if (
      adviser_teacher_id !== null
    ) {
      const adviser = await trx
        .selectFrom("teachers as t")
        .innerJoin(
          "teacher_info as ti",
          "t.teacher_info_id",
          "ti.teacher_info_id",
        )
        .innerJoin("user_accounts as ua", "ti.user_id", "ua.user_id")
        .select(["t.teacher_id", "t.teacher_status", "ua.account_status"])
        .where("t.teacher_id", "=", adviser_teacher_id)
        .executeTakeFirst();
      if (!adviser) {
        throw new Error("Adviser teacher not found.");
      }
      if (adviser.teacher_status !== "active") {
        throw new Error("The selected adviser is not an active teacher.");
      }
      if (adviser.account_status !== "active") {
        throw new Error("The selected adviser's account is not active.");
      }
    }
    /* * 5. Create the section assignment. */ const result = await trx
      .insertInto("sections")
      .values({
        section_name_id,
        section_name_version_id: Number(
          sectionNameVersion.section_name_version_id,
        ),
        sy_grade_level_id,
        adviser_teacher_id,
        section_status: "active",
      })
      .executeTakeFirst();
    return {
      section_id: Number(result.insertId),
      section_name_id,
      section_name_version_id: Number(
        sectionNameVersion.section_name_version_id,
      ),
      sy_grade_level_id,
      adviser_teacher_id,
      section_status: "active",
    };
  });
};

export const updateSectionStatus = async (section_id, status) => {
  if (!["active", "inactive"].includes(status)) {
    throw new Error("Invalid section status.");
  }
  return await db.transaction().execute(async (trx) => {
    const section = await trx
      .selectFrom("sections")
      .select(["section_id", "section_status"])
      .where("section_id", "=", section_id)
      .executeTakeFirst();
    if (!section) {
      throw new Error("Section not found.");
    }
    if (status === "inactive") {
      /* * Remove students from the section. */ await trx
        .updateTable("enrollment")
        .set({ section_id: null })
        .where("section_id", "=", section_id)
        .where("enr_status", "=", "enrolled")
        .executeTakeFirst();
      /* * Deactivate the section and remove its adviser. */ await trx
        .updateTable("sections")
        .set({ section_status: "inactive", adviser_teacher_id: null })
        .where("section_id", "=", section_id)
        .executeTakeFirst();
    } else {
      /* * Reactivation only changes the status. */ await trx
        .updateTable("sections")
        .set({ section_status: "active" })
        .where("section_id", "=", section_id)
        .executeTakeFirst();
    }
    return { section_id: Number(section_id), section_status: status };
  });
};

export const changeSectionTeacher = async (section_id, adviser_teacher_id) => {
  const adviser = await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("user_accounts as ua", "ti.user_id", "ua.user_id")
    .select(["t.teacher_id", "t.teacher_status", "ua.account_status"])
    .where("t.teacher_id", "=", adviser_teacher_id)
    .executeTakeFirst();
  if (!adviser) {
    throw new Error("Adviser teacher not found.");
  }
  if (adviser.teacher_status !== "active") {
    throw new Error("The selected adviser is not an active teacher.");
  }
  if (adviser.account_status !== "active") {
    throw new Error("The selected adviser's account is not active.");
  }
  const result = await db
    .updateTable("sections")
    .set({ adviser_teacher_id })
    .where("section_id", "=", section_id)
    .executeTakeFirst();
  if (Number(result.numUpdatedRows) !== 1) {
    throw new Error("Section not found.");
  }
  return {
    section_id: Number(section_id),
    adviser_teacher_id: Number(adviser_teacher_id),
  };
};

export const searchStudentsForSection = async (section_id, search = "") => {
  const section = await db
    .selectFrom("sections as s")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "s.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .select([
      "s.section_id",
      "s.sy_grade_level_id",
      "sgl.school_year_id",
      "sgl.grade_level_id",
    ])
    .where("s.section_id", "=", section_id)
    .where("s.section_status", "=", "active")
    .executeTakeFirst();
  if (!section) {
    throw new Error("Active section not found.");
  }
  let query = db
    .selectFrom("students as st")
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
    .innerJoin("enrollment as e", "st.stu_id", "e.stu_id")
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "e.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .select([
      "st.stu_id",
      "st.stu_num",
      "st.lrn",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "e.enrollment_id",
      "e.sy_grade_level_id",
      "e.section_id",
      "e.enr_status",
    ])
    .where("st.stu_status", "=", "active")
    .where("st.current_grade_level_id", "=", section.grade_level_id)
    .where("e.sy_grade_level_id", "=", section.sy_grade_level_id)
    .where("e.enr_status", "=", "enrolled")
    .where("e.section_id", "is", null);
  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query = query.where((eb) =>
      eb.or([
        sql`LOWER(${sql.ref("ai.first_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ai.middle_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ai.last_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("st.stu_num")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("st.lrn")}) LIKE ${term}`,
      ]),
    );
  }
  return await query
    .orderBy("ai.last_name", "asc")
    .orderBy("ai.first_name", "asc")
    .execute();
};

export const addStudentsToSection = async (section_id, student_ids) => {
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new Error("No students selected.");
  }
  return await db.transaction().execute(async (trx) => {
    /* * Get the target section. * * Students can only be assigned to a section * that already has an adviser. */ const section =
      await trx
        .selectFrom("sections as s")
        .innerJoin(
          "schoolyears_gradelevels as sgl",
          "s.sy_grade_level_id",
          "sgl.sy_grade_level_id",
        )
        .select([
          "s.section_id",
          "s.sy_grade_level_id",
          "s.adviser_teacher_id",
          "sgl.school_year_id",
          "sgl.grade_level_id",
        ])
        .where("s.section_id", "=", section_id)
        .where("s.section_status", "=", "active")
        .executeTakeFirst();
    if (!section) {
      throw new Error("Active section not found.");
    }
    if (section.adviser_teacher_id === null) {
      throw new Error(
        "An adviser must be assigned before students can be added to the section.",
      );
    }
    for (const stu_id of student_ids) {
      /* * Get student's current grade. */ const student = await trx
        .selectFrom("students")
        .select(["stu_id", "stu_status", "current_grade_level_id"])
        .where("stu_id", "=", stu_id)
        .executeTakeFirst();
      if (!student) {
        throw new Error(`Student ${stu_id} not found.`);
      }
      if (student.stu_status !== "active") {
        throw new Error(`Student ${stu_id} is not active.`);
      }
      /* * Student's current grade must match * the section's grade. */ if (
        Number(student.current_grade_level_id) !==
        Number(section.grade_level_id)
      ) {
        throw new Error(
          `Student ${stu_id} does not belong to this grade level.`,
        );
      }
      /* * Find the student's enrollment for * this school-year/grade-level. */ const enrollment =
        await trx
          .selectFrom("enrollment")
          .select([
            "enrollment_id",
            "section_id",
            "enr_status",
            "sy_grade_level_id",
          ])
          .where("stu_id", "=", stu_id)
          .where("sy_grade_level_id", "=", section.sy_grade_level_id)
          .where("enr_status", "=", "enrolled")
          .executeTakeFirst();
      if (!enrollment) {
        throw new Error(
          `Student ${stu_id} has no enrollment for this school year and grade level.`,
        );
      }
      if (enrollment.section_id !== null) {
        throw new Error(`Student ${stu_id} is already assigned to a section.`);
      }
      /* * Assign the existing enrollment to the section. */ await trx
        .updateTable("enrollment")
        .set({ section_id: section_id })
        .where("enrollment_id", "=", enrollment.enrollment_id)
        .executeTakeFirst();
    }
    return {
      section_id: Number(section_id),
      student_ids: student_ids.map(Number),
      count: student_ids.length,
    };
  });
};

export const removeStudentsFromSection = async (section_id, student_ids) => {
  const result = await db
    .updateTable("enrollment")
    .set({ section_id: null })
    .where("section_id", "=", section_id)
    .where("stu_id", "in", student_ids)
    .where("enr_status", "=", "enrolled")
    .executeTakeFirst();
  return { removed: Number(result.numUpdatedRows) };
};

export const promoteStudents = async (
  student_ids,
  target_sy_grade_level_id,
  promoted_by,
) => {
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new Error("No students selected.");
  }
  return await db.transaction().execute(async (trx) => {
    /* * Validate target school-year/grade-level. */ const target = await trx
      .selectFrom("schoolyears_gradelevels as sgl")
      .innerJoin(
        "school_years as sy",
        "sgl.school_year_id",
        "sy.school_year_id",
      )
      .innerJoin(
        "grade_levels as gl",
        "sgl.grade_level_id",
        "gl.grade_level_id",
      )
      .select([
        "sgl.sy_grade_level_id",
        "sgl.school_year_id",
        "sgl.grade_level_id",
        "gl.grade_level_name",
      ])
      .where("sgl.sy_grade_level_id", "=", target_sy_grade_level_id)
      .where("sgl.sy_gradelevel_status", "=", "active")
      .where("sy.sy_status", "=", "draft")
      .executeTakeFirst();
    if (!target) {
      throw new Error("Target school year and grade level are not active.");
    }
    for (const stu_id of student_ids) {
      /* * Get student. */ const student = await trx
        .selectFrom("students")
        .select(["stu_id", "stu_status", "current_grade_level_id"])
        .where("stu_id", "=", stu_id)
        .executeTakeFirst();
      if (!student) {
        throw new Error(`Student ${stu_id} not found.`);
      }
      if (student.stu_status !== "active") {
        throw new Error(`Student ${stu_id} is not active.`);
      }
      if (
        Number(student.current_grade_level_id) === Number(target.grade_level_id)
      ) {
        throw new Error(
          `Student ${stu_id} is already in the target grade level.`,
        );
      }
      const currentEnrollment = await trx
        .selectFrom("enrollment as e")
        .innerJoin(
          "schoolyears_gradelevels as sgl",
          "e.sy_grade_level_id",
          "sgl.sy_grade_level_id",
        )
        .select([
          "e.enrollment_id",
          "e.sy_grade_level_id",
          "e.enr_status",
          "sgl.grade_level_id",
        ])
        .where("e.stu_id", "=", stu_id)
        .where("e.enr_status", "=", "enrolled")
        .orderBy("e.date_enrolled", "desc")
        .executeTakeFirst();
      if (!currentEnrollment) {
        throw new Error(
          `Student ${stu_id} has no active enrollment to promote.`,
        );
      }
      const existingTargetEnrollment = await trx
        .selectFrom("enrollment")
        .select("enrollment_id")
        .where("stu_id", "=", stu_id)
        .where("sy_grade_level_id", "=", target.sy_grade_level_id)
        .executeTakeFirst();
      if (existingTargetEnrollment) {
        throw new Error(
          `Student ${stu_id} already has an enrollment for the target school year and grade level.`,
        );
      }
      await trx
        .updateTable("enrollment")
        .set({ enr_status: "promoted", promoted_by: promoted_by })
        .where("enrollment_id", "=", currentEnrollment.enrollment_id)
        .executeTakeFirst();
      await trx
        .updateTable("students")
        .set({ current_grade_level_id: target.grade_level_id })
        .where("stu_id", "=", stu_id)
        .executeTakeFirst();
      await trx
        .insertInto("enrollment")
        .values({
          sy_grade_level_id: target.sy_grade_level_id,
          section_id: null,
          stu_id: stu_id,
          enr_status: "enrolled",
          date_enrolled: new Date(),
          promoted_by: promoted_by,
        })
        .executeTakeFirst();
    }
    return {
      target_sy_grade_level_id: Number(target_sy_grade_level_id),
      student_ids: student_ids.map(Number),
      count: student_ids.length,
    };
  });
};

export const getAdviserTeachers = async () => {
  return await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin("user_accounts as ua", "ti.user_id", "ua.user_id")
    .select([
      "t.teacher_id",
      "t.teacher_num",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "ua.user_id",
      "ua.email",
      "ua.account_status",
    ])
    .where("t.teacher_status", "=", "active")
    .where("ua.account_status", "=", "active")
    .orderBy("ti.last_name", "asc")
    .orderBy("ti.first_name", "asc")
    .execute();
};

export const getSections = async () => {
  const sections = await db
    .selectFrom("sections as s")
    .innerJoin(
      "section_name_versions as snv",
      "s.section_name_version_id",
      "snv.section_name_version_id",
    )
    .innerJoin(
      "schoolyears_gradelevels as sgl",
      "s.sy_grade_level_id",
      "sgl.sy_grade_level_id",
    )
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .leftJoin("teachers as t", "s.adviser_teacher_id", "t.teacher_id")
    .leftJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .select([
      "s.section_id",
      "s.section_name_id",
      "s.section_name_version_id",
      "snv.section_name",
      "s.sy_grade_level_id",
      "gl.grade_level_name",
      "s.adviser_teacher_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "s.section_status",
    ])
    .where("s.section_status", "=", "active")
    .orderBy("snv.section_name", "asc")
    .execute();
  return sections.map((section) => ({
    ...section,
    adviser_name: section.adviser_teacher_id
      ? [section.first_name, section.middle_name, section.last_name]
          .filter(Boolean)
          .join(" ")
      : null,
  }));
};

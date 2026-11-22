import db from "../config/db.js";
import { logAdminActivity } from "./activityLogsModel.js";
import { sql } from "kysely";

export const getSectionSchoolYears = async () => {
  return await db
    .selectFrom("school_years")
    .select(["school_year_id", "start_date", "end_date", "sy_status"])
    .where("sy_status", "in", ["active", "archived"])
    .orderBy("start_date", "desc")
    .execute();
};

export const getSectionGradeLevels = async (selectedSchoolYearId) => {
  return await db
    .selectFrom("schoolyears_gradelevels as sygl")
    .innerJoin("school_years as sy", "sygl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sygl.grade_level_id", "gl.grade_level_id")
    .leftJoin("sections as s", (join) =>
      join
        .onRef("s.sy_grade_level_id", "=", "sygl.sy_grade_level_id")
        .on("s.section_status", "=", "active"),
    )
    .select([
      "sygl.sy_grade_level_id",
      "sygl.school_year_id",
      "sygl.grade_level_id",
      "sygl.sy_gradelevel_status",
      "sy.sy_status",
      "sy.start_date",
      "sy.end_date",
      "gl.grade_level_name",
    ])
    .select(({ fn }) => [fn.count("s.section_id").as("section_count")])
    .where("sygl.school_year_id", "=", Number(selectedSchoolYearId))
    .where("sygl.sy_gradelevel_status", "=", "active")
    .groupBy([
      "sygl.sy_grade_level_id",
      "sygl.school_year_id",
      "sygl.grade_level_id",
      "sygl.sy_gradelevel_status",
      "sy.sy_status",
      "sy.start_date",
      "sy.end_date",
      "gl.grade_level_name",
    ])
    .orderBy("sy.start_date", "asc")
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

export const assignSection = async (data, user_id) => {
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
    // 1. Validate master section name.
    const sectionName = await trx
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

    // 2. Get the current section name version.
    const sectionNameVersion = await trx
      .selectFrom("section_name_versions as snv")
      .select(["snv.section_name_version_id", "snv.section_name"])
      .where("snv.section_name_id", "=", section_name_id)
      .where("snv.section_name", "=", sectionName.section_name)
      .executeTakeFirst();

    if (!sectionNameVersion) {
      throw new Error("Current section name version not found.");
    }

    // 3. Prevent duplicate active section assignments.
    const existingSection = await trx
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

    // 4. Validate adviser if provided.
    if (adviser_teacher_id !== null) {
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

    // 5. Create section.
    const result = await trx
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

    const section_id = Number(result.insertId);

    const schoolYear = await trx
      .selectFrom("school_years as sy")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.school_year_id",
        "sy.school_year_id",
      )
      .select(["sy.start_date", "sy.end_date"])
      .where("sygl.sy_grade_level_id", "=", sy_grade_level_id)
      .executeTakeFirst();

    const startYear = new Date(schoolYear.start_date).getUTCFullYear();
    const endYear = new Date(schoolYear.end_date).getUTCFullYear();

    // 6. Log activity.
    await logAdminActivity(
      {
        user_id,
        user_action: "Created",
        user_module: "Sections",
        description: `Assigned section ${sectionNameVersion.section_name} to school year ${startYear} - ${endYear}.`,
      },
      trx,
    );

    return {
      section_id,
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

export const updateSectionStatus = async (section_id, status, user_id) => {
  section_id = Number(section_id);

  if (!["active", "inactive"].includes(status)) {
    throw new Error("Invalid section status.");
  }

  return await db.transaction().execute(async (trx) => {
    const section = await trx
      .selectFrom("sections as s")
      .innerJoin(
        "section_name_versions as snv",
        "s.section_name_version_id",
        "snv.section_name_version_id",
      )
      .select(["s.section_id", "s.section_status", "snv.section_name"])
      .where("s.section_id", "=", section_id)
      .executeTakeFirst();

    if (!section) {
      throw new Error("Section not found.");
    }

    if (status === "inactive") {
      // Remove currently enrolled students from the section.
      await trx
        .updateTable("enrollment")
        .set({ section_id: null })
        .where("section_id", "=", section_id)
        .where("enr_status", "=", "enrolled")
        .execute();

      // Deactivate section and remove adviser.
      await trx
        .updateTable("sections")
        .set({
          section_status: "inactive",
          adviser_teacher_id: null,
        })
        .where("section_id", "=", section_id)
        .execute();
    } else {
      await trx
        .updateTable("sections")
        .set({ section_status: "active" })
        .where("section_id", "=", section_id)
        .execute();
    }

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Sections",
        description: `${status === "active" ? "Activated" : "Deactivated"} section ${section.section_name}.`,
      },
      trx,
    );

    return {
      section_id,
      section_status: status,
    };
  });
};

export const changeSectionTeacher = async (
  section_id,
  adviser_teacher_id,
  user_id,
) => {
  section_id = Number(section_id);
  adviser_teacher_id = Number(adviser_teacher_id);

  return await db.transaction().execute(async (trx) => {
    const section = await trx
      .selectFrom("sections as s")
      .innerJoin(
        "section_name_versions as snv",
        "s.section_name_version_id",
        "snv.section_name_version_id",
      )
      .select(["s.section_id", "s.adviser_teacher_id", "snv.section_name"])
      .where("s.section_id", "=", section_id)
      .executeTakeFirst();

    if (!section) {
      throw new Error("Section not found.");
    }

    const adviser = await trx
      .selectFrom("teachers as t")
      .innerJoin(
        "teacher_info as ti",
        "t.teacher_info_id",
        "ti.teacher_info_id",
      )
      .innerJoin("user_accounts as ua", "ti.user_id", "ua.user_id")
      .select([
        "t.teacher_id",
        "t.teacher_num",
        "t.teacher_status",
        "ti.first_name",
        "ti.middle_name",
        "ti.last_name",
        "ua.account_status",
      ])
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

    await trx
      .updateTable("sections")
      .set({ adviser_teacher_id })
      .where("section_id", "=", section_id)
      .execute();

    const adviserName = [
      adviser.first_name,
      adviser.middle_name,
      adviser.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Sections",
        description: `Changed adviser of section ${section.section_name} to ${adviserName} (${adviser.teacher_num}).`,
      },
      trx,
    );

    return {
      section_id,
      adviser_teacher_id,
    };
  });
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

export const addStudentsToSection = async (
  section_id,
  student_ids,
  user_id,
) => {
  section_id = Number(section_id);

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new Error("No students selected.");
  }

  student_ids = [...new Set(student_ids.map(Number))];

  return await db.transaction().execute(async (trx) => {
    const section = await trx
      .selectFrom("sections as s")
      .innerJoin(
        "schoolyears_gradelevels as sgl",
        "s.sy_grade_level_id",
        "sgl.sy_grade_level_id",
      )
      .innerJoin(
        "section_name_versions as snv",
        "s.section_name_version_id",
        "snv.section_name_version_id",
      )
      .select([
        "s.section_id",
        "s.sy_grade_level_id",
        "s.adviser_teacher_id",
        "sgl.school_year_id",
        "sgl.grade_level_id",
        "snv.section_name",
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
      const student = await trx
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
        Number(student.current_grade_level_id) !==
        Number(section.grade_level_id)
      ) {
        throw new Error(
          `Student ${stu_id} does not belong to this grade level.`,
        );
      }

      const enrollment = await trx
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

      await trx
        .updateTable("enrollment")
        .set({ section_id })
        .where("enrollment_id", "=", enrollment.enrollment_id)
        .execute();
    }

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Sections",
        description: `Added ${student_ids.length} student(s) to section ${section.section_name}.`,
      },
      trx,
    );

    return {
      section_id,
      student_ids,
      count: student_ids.length,
    };
  });
};

export const removeStudentsFromSection = async (
  section_id,
  student_ids,
  user_id,
) => {
  section_id = Number(section_id);

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new Error("No students selected.");
  }

  student_ids = [...new Set(student_ids.map(Number))];

  return await db.transaction().execute(async (trx) => {
    const section = await trx
      .selectFrom("sections as s")
      .innerJoin(
        "section_name_versions as snv",
        "s.section_name_version_id",
        "snv.section_name_version_id",
      )
      .select(["s.section_id", "snv.section_name"])
      .where("s.section_id", "=", section_id)
      .executeTakeFirst();

    if (!section) {
      throw new Error("Section not found.");
    }

    const result = await trx
      .updateTable("enrollment")
      .set({ section_id: null })
      .where("section_id", "=", section_id)
      .where("stu_id", "in", student_ids)
      .where("enr_status", "=", "enrolled")
      .executeTakeFirst();

    const removed = Number(result.numUpdatedRows);

    if (removed > 0) {
      await logAdminActivity(
        {
          user_id,
          user_action: "Updated",
          user_module: "Sections",
          description: `Removed ${removed} student(s) from section ${section.section_name}.`,
        },
        trx,
      );
    }

    return { removed };
  });
};

export const promoteStudents = async (
  student_ids,
  target_sy_grade_level_id,
  promoted_by,
) => {
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new Error("No students selected.");
  }

  student_ids = [...new Set(student_ids.map(Number))];
  target_sy_grade_level_id = Number(target_sy_grade_level_id);

  return await db.transaction().execute(async (trx) => {
    const target = await trx
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
        "sy.start_date",
        "sy.end_date",
      ])
      .where("sgl.sy_grade_level_id", "=", target_sy_grade_level_id)
      .where("sgl.sy_gradelevel_status", "=", "active")
      .where("sy.sy_status", "in", ["active", "draft"])
      .executeTakeFirst();

    if (!target) {
      throw new Error("Target school year and grade level are not available.");
    }

    for (const stu_id of student_ids) {
      const student = await trx
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
        .set({
          enr_status: "promoted",
          promoted_by,
        })
        .where("enrollment_id", "=", currentEnrollment.enrollment_id)
        .execute();

      await trx
        .updateTable("students")
        .set({ current_grade_level_id: target.grade_level_id })
        .where("stu_id", "=", stu_id)
        .execute();

      await trx
        .insertInto("enrollment")
        .values({
          sy_grade_level_id: target.sy_grade_level_id,
          section_id: null,
          stu_id,
          enr_status: "enrolled",
          date_enrolled: new Date(),
          promoted_by,
        })
        .execute();
    }

    const startYear = new Date(target.start_date).getUTCFullYear();
    const endYear = new Date(target.end_date).getUTCFullYear();

    await logAdminActivity(
      {
        user_id: promoted_by,
        user_action: "Updated",
        user_module: "Students",
        description: `Promoted ${student_ids.length} student(s) to ${target.grade_level_name} for school year ${startYear} - ${endYear}.`,
      },
      trx,
    );

    return {
      target_sy_grade_level_id,
      student_ids,
      count: student_ids.length,
    };
  });
};

export const retainStudents = async (
  student_ids,
  target_sy_grade_level_id,
  retained_by,
) => {
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new Error("No students selected.");
  }

  student_ids = [...new Set(student_ids.map(Number))];
  target_sy_grade_level_id = Number(target_sy_grade_level_id);

  return await db.transaction().execute(async (trx) => {
    // 1. Validate target school year and grade level.
    const target = await trx
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
        "sy.start_date",
        "sy.end_date",
      ])
      .where("sgl.sy_grade_level_id", "=", target_sy_grade_level_id)
      .where("sgl.sy_gradelevel_status", "=", "active")
      .where("sy.sy_status", "=", "draft")
      .executeTakeFirst();

    if (!target) {
      throw new Error("Target school year and grade level are not available.");
    }

    for (const stu_id of student_ids) {
      // 2. Validate student.
      const student = await trx
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

      // 3. Student must remain in their current grade level.
      if (
        Number(student.current_grade_level_id) !== Number(target.grade_level_id)
      ) {
        throw new Error(
          `Student ${stu_id} does not belong to the selected grade level. Use promotion if the student is moving to another grade level.`,
        );
      }

      // 4. Find the student's current enrollment.
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
          `Student ${stu_id} has no active enrollment to retain.`,
        );
      }

      // 5. Prevent duplicate enrollment in the target year.
      const existingTargetEnrollment = await trx
        .selectFrom("enrollment")
        .select("enrollment_id")
        .where("stu_id", "=", stu_id)
        .where("sy_grade_level_id", "=", target.sy_grade_level_id)
        .executeTakeFirst();

      if (existingTargetEnrollment) {
        throw new Error(
          `Student ${stu_id} already has an enrollment for the selected school year and grade level.`,
        );
      }

      // 6. Mark previous enrollment as retained.
      await trx
        .updateTable("enrollment")
        .set({ enr_status: "retained" })
        .where("enrollment_id", "=", currentEnrollment.enrollment_id)
        .execute();

      // 7. Create new enrollment in the same grade level.
      await trx
        .insertInto("enrollment")
        .values({
          sy_grade_level_id: target.sy_grade_level_id,
          section_id: null,
          stu_id,
          enr_status: "enrolled",
          date_enrolled: new Date(),
        })
        .execute();
    }

    // 8. Log activity.
    const startYear = new Date(target.start_date).getUTCFullYear();
    const endYear = new Date(target.end_date).getUTCFullYear();

    await logAdminActivity(
      {
        user_id: retained_by,
        user_action: "Updated",
        user_module: "Students",
        description: `Retained ${student_ids.length} student(s) in ${target.grade_level_name} for school year ${startYear} - ${endYear}.`,
      },
      trx,
    );

    return {
      target_sy_grade_level_id,
      student_ids,
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

export const getSections = async (school_year_id) => {
  let query = db
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
      "sgl.school_year_id",
      "s.adviser_teacher_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "s.section_status",
    ])
    .where("s.section_status", "=", "active")
    .where("sgl.school_year_id", "=", Number(school_year_id))
    .orderBy("snv.section_name", "asc");

  const sections = await query.execute();

  return sections.map((section) => ({
    ...section,
    adviser_name: section.adviser_teacher_id
      ? [section.first_name, section.middle_name, section.last_name]
          .filter(Boolean)
          .join(" ")
      : null,
  }));
};

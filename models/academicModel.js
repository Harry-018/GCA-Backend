import db from "../config/db.js";

import { sql } from "kysely";

export const getSchoolYears = async ({
  status = "all",
  search = "",
  page = 1,
  limit = 10,
}) => {
  const offset = (page - 1) * limit;

  let query = db.selectFrom("school_years").selectAll();

  // Status filter
  if (status !== "all") {
    query = query.where("sy_status", "=", status);
  }

  // Search
  if (search.trim() !== "") {
    const term = `%${search.trim()}%`;

    query = query.where((eb) =>
      eb.or([
        eb("start_date", "like", term),
        eb("end_date", "like", term),
        eb("sy_status", "like", term),
        eb("enrollment_status", "like", term),
      ]),
    );
  }

  // Newest school year first
  query = query.orderBy("start_date", "desc").limit(limit).offset(offset);

  const schoolYears = await query.execute();

  // Total records for pagination
  let countQuery = db
    .selectFrom("school_years")
    .select(sql`count(*)`.as("total"));

  if (status !== "all") {
    countQuery = countQuery.where("sy_status", "=", status);
  }

  if (search.trim() !== "") {
    const term = `%${search.trim()}%`;

    countQuery = countQuery.where((eb) =>
      eb.or([
        eb("start_date", "like", term),
        eb("end_date", "like", term),
        eb("sy_status", "like", term),
        eb("enrollment_status", "like", term),
      ]),
    );
  }

  const countResult = await countQuery.executeTakeFirst();

  const total = Number(countResult.total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: schoolYears,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getSchoolYearInfo = async (school_year_id) => {
  return await db
    .selectFrom("school_years")
    .selectAll()
    .where("school_year_id", "=", school_year_id)
    .executeTakeFirst();
};

export const createSchoolYear = async (data) => {
  const result = await db
    .insertInto("school_years")
    .values({
      start_date: data.start_date,
      end_date: data.end_date,
      enrollment_status: data.enrollment_status,
      sy_status: "draft",
    })
    .executeTakeFirst();

  return { school_year_id: Number(result.insertId) };
};

export const editSchoolYear = async (school_year_id, data) => {
  return await db.transaction().execute(async (trx) => {
    if (data.sy_status === "active") {
      await trx
        .updateTable("school_years")
        .set({
          sy_status: "archived",
          enrollment_status: "closed",
        })
        .where("sy_status", "=", "active")
        .where("school_year_id", "!=", school_year_id)
        .execute();
    }

    const result = await trx
      .updateTable("school_years")
      .set({
        start_date: data.start_date,
        end_date: data.end_date,
        enrollment_status: data.enrollment_status,
        sy_status: data.sy_status,
      })
      .where("school_year_id", "=", school_year_id)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) !== 1) {
      throw new Error("School year not found.");
    }

    return {
      school_year_id: Number(school_year_id),
    };
  });
};

//grade levels

export const getGradeLevels = async () => {
  return await db.selectFrom("grade_levels").selectAll().execute();
};

export const getGradeLevel = async (grade_level_id) => {
  return await db
    .selectFrom("grade_levels")
    .selectAll()
    .where("grade_level_id", "=", grade_level_id)
    .executeTakeFirst();
};

export const createGradeLevel = async (data) => {
  const result = await db
    .insertInto("grade_levels")
    .values({
      grade_level_name: data.grade_level_name,
    })
    .executeTakeFirst();

  return { grade_level_id: Number(result.insertId) };
};

export const editGradeLevel = async (grade_level_id, data) => {
  await db
    .updateTable("grade_levels")
    .set({ grade_level_name: data.grade_level_name })
    .where("grade_level_id", "=", grade_level_id)
    .executeTakeFirst();

  return {
    grade_level_id: Number(grade_level_id),
  };
};

/* sy_gradelevels*/
export const getGradeLevelBySchoolYearGradeLevel = async (
  sy_grade_level_id,
) => {
  return await db
    .selectFrom("schoolyears_gradelevels as sgl")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .select([
      "sgl.sy_grade_level_id",
      "sgl.grade_level_id",
      "gl.grade_level_name",
    ])
    .where("sgl.sy_grade_level_id", "=", sy_grade_level_id)
    .where("sgl.sy_gradelevel_status", "=", "active")
    .executeTakeFirst();
};

export const getGradelevelsInSchoolyear = async () => {
  return await db
    .selectFrom("schoolyears_gradelevels as sgl")
    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")
    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")
    .leftJoin("schoolyears_gradelevels_subjects as sgls", (join) =>
      join
        .onRef("sgl.sy_grade_level_id", "=", "sgls.sy_grade_level_id")
        .on("sgls.sy_gradelevel_subject_status", "=", "active"),
    )
    .select([
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sgl.sy_grade_level_id",
    ])
    .select(({ fn }) => [
      fn.count("sgls.sy_gradelevel_subject_id").as("subject_count"),
    ])
    .where("sy.sy_status", "=", "active")
    .where("sgl.sy_gradelevel_status", "=", "active")
    .groupBy([
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sgl.sy_grade_level_id",
    ])
    .execute();
};

export const addGradelevelsToSchoolYears = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const activeSY = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!activeSY) {
      throw new Error("No active school year found.");
    }

    const activeSY_id = Number(activeSY.school_year_id);

    // Check if the grade level already exists in the active school year
    const existing = await trx
      .selectFrom("schoolyears_gradelevels")
      .select(["sy_grade_level_id", "sy_gradelevel_status"])
      .where("school_year_id", "=", activeSY_id)
      .where("grade_level_id", "=", data.grade_level_id)
      .executeTakeFirst();

    // Grade level already exists
    if (existing) {
      // Reactivate if archived
      if (existing.sy_gradelevel_status === "archived") {
        await trx
          .updateTable("schoolyears_gradelevels")
          .set({
            sy_gradelevel_status: "active",
          })
          .where("sy_grade_level_id", "=", existing.sy_grade_level_id)
          .executeTakeFirst();
      }

      return {
        sy_gradelevel_id: Number(existing.sy_grade_level_id),
      };
    }

    // Grade level does not exist yet
    const result = await trx
      .insertInto("schoolyears_gradelevels")
      .values({
        school_year_id: activeSY_id,
        grade_level_id: data.grade_level_id,
        sy_gradelevel_status: "active",
      })
      .executeTakeFirst();

    return {
      sy_gradelevel_id: Number(result.insertId),
    };
  });
};

export const removeGradeLevelFromSchoolYear = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const checkActiveSchoolYear = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!checkActiveSchoolYear) {
      throw new Error("No active school year found.");
    }

    const activeSchoolYearId = Number(checkActiveSchoolYear.school_year_id);

    const checkAppUsage = await trx
      .selectFrom("applications")
      .select("application_id")
      .where("grade_level_id", "=", data.grade_level_id)
      .where("school_year_id", "=", activeSchoolYearId)
      .execute();

    if (checkAppUsage.length !== 0) {
      throw new Error(
        "Grade level cannot be removed because it is already being used.",
      );
    }

    const gradeLevel = await trx
      .selectFrom("schoolyears_gradelevels")
      .select("sy_grade_level_id")
      .where("grade_level_id", "=", data.grade_level_id)
      .where("school_year_id", "=", activeSchoolYearId)
      .where("sy_gradelevel_status", "=", "active")
      .executeTakeFirst();

    if (!gradeLevel) {
      throw new Error("Grade level is not assigned to the active school year.");
    }

    await trx
      .updateTable("schoolyears_gradelevels")
      .set({
        sy_gradelevel_status: "archived",
      })
      .where("sy_grade_level_id", "=", gradeLevel.sy_grade_level_id)
      .executeTakeFirst();

    return {
      sy_grade_level_id: Number(gradeLevel.sy_grade_level_id),
    };
  });
};

//subjects in grade level

export const getSubjects = async () => {
  return await db
    .selectFrom("subjects")
    .select(["subject_id", "subject_name"])
    .orderBy("subject_name", "asc")
    .execute();
};

export const getSubjectsByGradeLevel = async (sy_grade_level_id) => {
  return await db
    .selectFrom("subjects as s")
    .leftJoin("schoolyears_gradelevels_subjects as sgls", (join) =>
      join
        .onRef("s.subject_id", "=", "sgls.subject_id")
        .on("sgls.sy_grade_level_id", "=", sy_grade_level_id)
        .on("sgls.sy_gradelevel_subject_status", "=", "active"),
    )
    .select(["s.subject_id", "s.subject_name"])
    .where("sgls.subject_id", "is", null)
    .orderBy("s.subject_name", "asc")
    .execute();
};

export const getSubjectsInGradeLevel = async (sy_grade_level_id) => {
  return await db
    .selectFrom("schoolyears_gradelevels_subjects as sgls")
    .innerJoin("subjects as s", "sgls.subject_id", "s.subject_id")
    .select(["sgls.sy_gradelevel_subject_id", "s.subject_id", "s.subject_name"])
    .where("sgls.sy_grade_level_id", "=", sy_grade_level_id)
    .where("sgls.sy_gradelevel_subject_status", "=", "active")
    .orderBy("s.subject_name", "asc")
    .execute();
};

export const addSubjectsToGradeLevel = async (data) => {
  const sy_grade_level_id = Number(data.sy_grade_level_id);

  const subject_ids = [
    ...new Set(data.subject_ids.map((subject_id) => Number(subject_id))),
  ];

  return await db.transaction().execute(async (trx) => {
    // Get existing subject assignments for this grade level
    const existingAssignments = await trx
      .selectFrom("schoolyears_gradelevels_subjects")
      .select([
        "sy_gradelevel_subject_id",
        "subject_id",
        "sy_gradelevel_subject_status",
      ])
      .where("sy_grade_level_id", "=", sy_grade_level_id)
      .where("subject_id", "in", subject_ids)
      .execute();

    const existingMap = new Map(
      existingAssignments.map((item) => [Number(item.subject_id), item]),
    );

    const subjectsToInsert = [];
    const subjectsToReactivate = [];

    for (const subject_id of subject_ids) {
      const existing = existingMap.get(subject_id);

      if (!existing) {
        // Never assigned before
        subjectsToInsert.push({
          sy_grade_level_id,
          subject_id,
          sy_gradelevel_subject_status: "active",
        });
      } else if (existing.sy_gradelevel_subject_status === "archived") {
        // Previously assigned but archived
        subjectsToReactivate.push(existing.sy_gradelevel_subject_id);
      }

      // If already active, do nothing
    }

    // Reactivate archived assignments
    if (subjectsToReactivate.length > 0) {
      await trx
        .updateTable("schoolyears_gradelevels_subjects")
        .set({
          sy_gradelevel_subject_status: "active",
        })
        .where("sy_gradelevel_subject_id", "in", subjectsToReactivate)
        .execute();
    }

    // Insert completely new assignments
    let inserted = [];

    if (subjectsToInsert.length > 0) {
      const result = await trx
        .insertInto("schoolyears_gradelevels_subjects")
        .values(subjectsToInsert)
        .execute();

      inserted = subjectsToInsert.map((item) => item.subject_id);
    }

    return {
      inserted: inserted.length,
      reactivated: subjectsToReactivate.length,
      skipped:
        subject_ids.length - inserted.length - subjectsToReactivate.length,
      subject_ids: inserted,
    };
  });
};

export const removeSubjectFromGradeLevel = async (sy_gradelevel_subject_id) => {
  await db
    .updateTable("schoolyears_gradelevels_subjects")
    .set({
      sy_gradelevel_subject_status: "archived",
    })
    .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
    .executeTakeFirst();

  return {
    sy_gradelevel_subject_id: Number(sy_gradelevel_subject_id),
  };
};

//skills

export const getSkillsBySubject = async (subject_id) => {
  const skills = await db
    .selectFrom("skill")
    .selectAll()
    .where("subject_id", "=", subject_id)
    .execute();

  return skills;
};

export const getSkillsByGradeLevelSubject = async (
  sy_gradelevel_subject_id,
) => {
  const skills = await db
    .selectFrom("schoolyears_gradelevels_subjects_skills as sgs")
    .innerJoin("skill as s", "s.skill_id", "sgs.skill_id")
    .select([
      "sgs.sy_gradelevel_subject_skill_id",
      "sgs.skill_id",
      "s.skill_name",
      "s.description",
      "sgs.skill_status",
    ])
    .where("sgs.sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
    .execute();

  return skills;
};

export const getAvailableSkillsByGradeLevelSubject = async (
  sy_gradelevel_subject_id,
) => {
  return await db
    .selectFrom("skill as s")
    .innerJoin(
      "schoolyears_gradelevels_subjects as sgs",
      "sgs.subject_id",
      "s.subject_id",
    )
    .leftJoin("schoolyears_gradelevels_subjects_skills as sgss", (join) =>
      join
        .onRef("s.skill_id", "=", "sgss.skill_id")
        .onRef(
          "sgss.sy_gradelevel_subject_id",
          "=",
          "sgs.sy_gradelevel_subject_id",
        )
        .on("sgss.skill_status", "=", "active"),
    )
    .select(["s.skill_id", "s.skill_name", "s.description"])
    .where("sgs.sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
    .where("sgss.skill_id", "is", null)
    .orderBy("s.skill_name", "asc")
    .execute();
};

//creates masterskill
export const addSkillToSubject = async (subject_id, data) => {
  const result = await db
    .insertInto("skill")
    .values({
      skill_name: data.skill_name,
      description: data.description,
      subject_id,
    })
    .executeTakeFirst();

  return result;
};

//assign skill to subject not create
export const assignSkillsToGradeLevelSubject = async (
  sy_gradelevel_subject_id,
  skill_ids,
) => {
  const uniqueSkillIds = [
    ...new Set(skill_ids.map((skill_id) => Number(skill_id))),
  ];

  return await db.transaction().execute(async (trx) => {
    // 1. Check that the grade-level subject exists
    const gradeLevelSubject = await trx
      .selectFrom("schoolyears_gradelevels_subjects")
      .select(["subject_id"])
      .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .executeTakeFirst();

    if (!gradeLevelSubject) {
      throw new Error("Grade-level subject not found.");
    }

    // 2. Make sure all selected skills belong to this subject
    const skills = await trx
      .selectFrom("skill")
      .select(["skill_id"])
      .where("skill_id", "in", uniqueSkillIds)
      .where("subject_id", "=", gradeLevelSubject.subject_id)
      .execute();

    if (skills.length !== uniqueSkillIds.length) {
      throw new Error(
        "One or more selected skills do not belong to this subject.",
      );
    }

    // 3. Check existing assignments
    const existingAssignments = await trx
      .selectFrom("schoolyears_gradelevels_subjects_skills")
      .select(["sy_gradelevel_subject_skill_id", "skill_id", "skill_status"])
      .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .where("skill_id", "in", uniqueSkillIds)
      .execute();

    const existingMap = new Map(
      existingAssignments.map((item) => [Number(item.skill_id), item]),
    );

    const skillsToInsert = [];
    const skillsToReactivate = [];

    // 4. Separate new skills from archived skills
    for (const skill_id of uniqueSkillIds) {
      const existing = existingMap.get(skill_id);

      if (!existing) {
        skillsToInsert.push({
          sy_gradelevel_subject_id,
          skill_id,
          skill_status: "active",
        });
      } else if (existing.skill_status === "archived") {
        skillsToReactivate.push(existing.sy_gradelevel_subject_skill_id);
      }
    }

    // 5. Reactivate archived assignments
    if (skillsToReactivate.length > 0) {
      await trx
        .updateTable("schoolyears_gradelevels_subjects_skills")
        .set({
          skill_status: "active",
        })
        .where("sy_gradelevel_subject_skill_id", "in", skillsToReactivate)
        .execute();
    }

    // 6. Insert completely new assignments
    if (skillsToInsert.length > 0) {
      await trx
        .insertInto("schoolyears_gradelevels_subjects_skills")
        .values(skillsToInsert)
        .execute();
    }

    return {
      inserted: skillsToInsert.length,
      reactivated: skillsToReactivate.length,
      skipped:
        uniqueSkillIds.length -
        skillsToInsert.length -
        skillsToReactivate.length,
      skill_ids: skillsToInsert.map((item) => item.skill_id),
    };
  });
};

//edit master skill
export const editSkill = async (subject_id, skill_id, data) => {
  const result = await db
    .updateTable("skill")
    .set({
      skill_name: data.skill_name,
      description: data.description,
    })
    .where("skill_id", "=", skill_id)
    .where("subject_id", "=", subject_id)
    .executeTakeFirst();

  return result;
};

//archive skill not delete
export const archiveSkill = async (sy_gradelevel_subject_id, skill_id) => {
  const result = await db
    .updateTable("schoolyears_gradelevels_subjects_skills")
    .set({
      skill_status: "archived",
    })
    .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
    .where("skill_id", "=", skill_id)
    .executeTakeFirst();

  return result;
};

//restore skill
export const restoreSkill = async (sy_gradelevel_subject_id, skill_id) => {
  const result = await db
    .updateTable("schoolyears_gradelevels_subjects_skills")
    .set({
      skill_status: "active",
    })
    .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
    .where("skill_id", "=", skill_id)
    .executeTakeFirst();

  return result;
};

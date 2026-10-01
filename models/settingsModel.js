import db from "../config/db.js";

export const getGradeLevelsWithSubjectCount = async () => {
  return await db
    .selectFrom("grade_levels as gl")
    .leftJoin(
      "schoolyears_gradelevels as sygl",
      "sygl.grade_level_id",
      "gl.grade_level_id",
    )
    .leftJoin(
      "schoolyears_gradelevels_subjects as sygls",
      "sygls.sy_grade_level_id",
      "sygl.sy_grade_level_id",
    )
    .leftJoin("school_years as sy", "sy.school_year_id", "sygl.school_year_id")
    .select(["gl.grade_level_id", "gl.grade_level_name"])
    .select((eb) => [
      eb.fn.count("sygls.sy_gradelevel_subject_id").as("subject_count"),
    ])
    .where("sy.sy_status", "=", "active")
    .where("sygl.sy_gradelevel_status", "=", "active")
    .where("sygls.sy_gradelevel_subject_status", "=", "active")
    .groupBy(["gl.grade_level_id", "gl.grade_level_name"])
    .orderBy("gl.grade_level_id", "asc")
    .execute();
};

export const getAllSubjects = async () => {
  return await db
    .selectFrom("subjects")
    .select(["subject_id", "subject_name"])
    .orderBy("subject_name", "asc")
    .execute();
};

export const getSubjectsByGradeLevel = async (gradeLevelId) => {
  return await db
    .selectFrom("schoolyears_gradelevels as sygl")
    .innerJoin("school_years as sy", "sy.school_year_id", "sygl.school_year_id")
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "sygl.grade_level_id")
    .innerJoin(
      "schoolyears_gradelevels_subjects as sygls",
      "sygls.sy_grade_level_id",
      "sygl.sy_grade_level_id",
    )
    .innerJoin(
      "subject_versions as sv",
      "sv.subject_version_id",
      "sygls.subject_version_id",
    )
    .innerJoin("subjects as s", "s.subject_id", "sv.subject_id")
    .select([
      "sygls.sy_gradelevel_subject_id",
      "gl.grade_level_name",
      "s.subject_id",
      "sv.subject_version_id",
      "sv.subject_name",
      "sygls.sy_gradelevel_subject_status",
    ])
    .where("sygl.grade_level_id", "=", gradeLevelId)
    .where("sy.sy_status", "=", "active")
    .where("sygls.sy_gradelevel_subject_status", "=", "active")
    .orderBy("sv.subject_name", "asc")
    .execute();
};

export const addSubjectToGradeLevel = async ({ gradeLevelId, subjectId }) => {
  return await db.transaction().execute(async (trx) => {
    // 1. Get the active school year
    const activeSchoolYear = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!activeSchoolYear) {
      throw new Error("No active school year found.");
    }

    // 2. Get the grade level for the active school year
    const schoolYearGradeLevel = await trx
      .selectFrom("schoolyears_gradelevels")
      .select("sy_grade_level_id")
      .where("school_year_id", "=", activeSchoolYear.school_year_id)
      .where("grade_level_id", "=", gradeLevelId)
      .where("sy_gradelevel_status", "=", "active")
      .executeTakeFirst();

    if (!schoolYearGradeLevel) {
      throw new Error(
        "This grade level is not configured for the active school year.",
      );
    }

    // 3. Check that the master subject exists
    const subject = await trx
      .selectFrom("subjects")
      .select(["subject_id", "subject_name"])
      .where("subject_id", "=", subjectId)
      .executeTakeFirst();

    if (!subject) {
      throw new Error("Subject not found.");
    }

    // 4. Find the current version of the subject
    const subjectVersion = await trx
      .selectFrom("subject_versions")
      .select(["subject_version_id", "subject_id", "subject_name"])
      .where("subject_id", "=", subject.subject_id)
      .where("subject_name", "=", subject.subject_name)
      .executeTakeFirst();

    if (!subjectVersion) {
      throw new Error("Current subject version not found.");
    }

    // 5. Check if this subject is already assigned
    const existingAssignment = await trx
      .selectFrom("schoolyears_gradelevels_subjects")
      .select([
        "sy_gradelevel_subject_id",
        "sy_gradelevel_subject_status",
        "subject_version_id",
      ])
      .where("sy_grade_level_id", "=", schoolYearGradeLevel.sy_grade_level_id)
      .where("subject_id", "=", subject.subject_id)
      .executeTakeFirst();

    if (existingAssignment) {
      // Already active
      if (existingAssignment.sy_gradelevel_subject_status === "active") {
        throw new Error("Subject is already assigned to this grade level.");
      }

      // Previously archived → reactivate it
      await trx
        .updateTable("schoolyears_gradelevels_subjects")
        .set({
          sy_gradelevel_subject_status: "active",
          subject_version_id: subjectVersion.subject_version_id,
        })
        .where(
          "sy_gradelevel_subject_id",
          "=",
          existingAssignment.sy_gradelevel_subject_id,
        )
        .executeTakeFirst();

      return {
        sy_gradelevel_subject_id: existingAssignment.sy_gradelevel_subject_id,
        sy_grade_level_id: schoolYearGradeLevel.sy_grade_level_id,
        subject_id: subject.subject_id,
        subject_version_id: subjectVersion.subject_version_id,
        subject_name: subjectVersion.subject_name,
      };
    }

    // 6. No previous assignment → create it
    const result = await trx
      .insertInto("schoolyears_gradelevels_subjects")
      .values({
        sy_grade_level_id: schoolYearGradeLevel.sy_grade_level_id,
        subject_version_id: subjectVersion.subject_version_id,
        subject_id: subject.subject_id,
        sy_gradelevel_subject_status: "active",
      })
      .executeTakeFirst();

    return {
      sy_gradelevel_subject_id: Number(result.insertId),
      sy_grade_level_id: schoolYearGradeLevel.sy_grade_level_id,
      subject_id: subject.subject_id,
      subject_version_id: subjectVersion.subject_version_id,
      subject_name: subjectVersion.subject_name,
    };
  });
};

export const removeSubjectFromGradeLevel = async (syGradelevelSubjectId) => {
  const result = await db
    .updateTable("schoolyears_gradelevels_subjects")
    .set({
      sy_gradelevel_subject_status: "archived",
    })
    .where("sy_gradelevel_subject_id", "=", syGradelevelSubjectId)
    .where("sy_gradelevel_subject_status", "=", "active")
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) {
    throw new Error("Subject assignment not found or already archived.");
  }

  return {
    sy_gradelevel_subject_id: syGradelevelSubjectId,
  };
};

export const createSubject = async (subjectName) => {
  const name = subjectName.trim();

  if (!name) {
    throw new Error("Subject name is required.");
  }

  return await db.transaction().execute(async (trx) => {
    // 1. Check if subject already exists
    const existingSubject = await trx
      .selectFrom("subjects")
      .select("subject_id")
      .where("subject_name", "=", name)
      .executeTakeFirst();

    if (existingSubject) {
      throw new Error("Subject already exists.");
    }

    // 2. Create master subject
    const subjectResult = await trx
      .insertInto("subjects")
      .values({
        subject_name: name,
      })
      .executeTakeFirst();

    const subjectId = Number(subjectResult.insertId);

    // 3. Create its initial version
    const versionResult = await trx
      .insertInto("subject_versions")
      .values({
        subject_id: subjectId,
        subject_name: name,
      })
      .executeTakeFirst();

    const subjectVersionId = Number(versionResult.insertId);

    return {
      subject_id: subjectId,
      subject_version_id: subjectVersionId,
      subject_name: name,
    };
  });
};

export const renameSubject = async (subjectId, subjectName) => {
  const name = subjectName.trim();

  if (!name) {
    throw new Error("Subject name is required.");
  }

  return await db.transaction().execute(async (trx) => {
    // 1. Find the existing master subject
    const subject = await trx
      .selectFrom("subjects")
      .select(["subject_id", "subject_name"])
      .where("subject_id", "=", subjectId)
      .executeTakeFirst();

    if (!subject) {
      throw new Error("Subject not found.");
    }

    // 2. Check if another subject already has this name
    const duplicateSubject = await trx
      .selectFrom("subjects")
      .select("subject_id")
      .where("subject_name", "=", name)
      .where("subject_id", "!=", subjectId)
      .executeTakeFirst();

    if (duplicateSubject) {
      throw new Error("Another subject already uses this name.");
    }

    // 3. Update the master subject
    await trx
      .updateTable("subjects")
      .set({
        subject_name: name,
      })
      .where("subject_id", "=", subjectId)
      .executeTakeFirst();

    // 4. Create the new subject version
    const versionResult = await trx
      .insertInto("subject_versions")
      .values({
        subject_id: subjectId,
        subject_name: name,
      })
      .executeTakeFirst();

    const subjectVersionId = Number(versionResult.insertId);

    return {
      subject_id: subjectId,
      subject_version_id: subjectVersionId,
      subject_name: name,
    };
  });
};

export const createSkill = async (data) => {
  const { subject_id, skill_name, description } = data;

  if (!subject_id) {
    throw new Error("Subject ID is required.");
  }

  if (!skill_name?.trim()) {
    throw new Error("Skill name is required.");
  }

  // Make sure the subject exists
  const subject = await db
    .selectFrom("subjects")
    .select("subject_id")
    .where("subject_id", "=", subject_id)
    .executeTakeFirst();

  if (!subject) {
    throw new Error("Subject not found.");
  }

  // Prevent duplicate skill names within the same subject
  const existingSkill = await db
    .selectFrom("skill")
    .select("skill_id")
    .where("subject_id", "=", subject_id)
    .where("skill_name", "=", skill_name.trim())
    .executeTakeFirst();

  if (existingSkill) {
    throw new Error("Skill already exists for this subject.");
  }

  const result = await db
    .insertInto("skill")
    .values({
      subject_id,
      skill_name: skill_name.trim(),
      description: description?.trim() || null,
    })
    .executeTakeFirst();

  return {
    skill_id: Number(result.insertId),
    subject_id,
    skill_name: skill_name.trim(),
    description: description?.trim() || null,
  };
};

export const getSkillsBySubject = async (subjectId) => {
  return await db
    .selectFrom("skill")
    .select(["skill_id", "skill_name", "description", "subject_id"])
    .where("subject_id", "=", subjectId)
    .where("skill_status", "=", "active")
    .orderBy("skill_id", "asc")
    .execute();
};

export const updateSkill = async (skillId, data) => {
  const { skill_name, description } = data;

  if (!skill_name?.trim()) {
    throw new Error("Skill name is required.");
  }

  // 1. Find the existing skill
  const skill = await db
    .selectFrom("skill")
    .select(["skill_id", "subject_id"])
    .where("skill_id", "=", skillId)
    .where("skill_status", "=", "active")
    .executeTakeFirst();

  if (!skill) {
    throw new Error("Skill not found.");
  }

  // 2. Check for duplicate skill name within the same subject
  const duplicateSkill = await db
    .selectFrom("skill")
    .select("skill_id")
    .where("subject_id", "=", skill.subject_id)
    .where("skill_name", "=", skill_name.trim())
    .where("skill_id", "!=", skillId)
    .executeTakeFirst();

  if (duplicateSkill) {
    throw new Error("Another skill with this name already exists.");
  }

  // 3. Update the skill
  await db
    .updateTable("skill")
    .set({
      skill_name: skill_name.trim(),
      description: description?.trim() || null,
    })
    .where("skill_id", "=", skillId)
    .executeTakeFirst();

  return {
    skill_id: skillId,
    subject_id: skill.subject_id,
    skill_name: skill_name.trim(),
    description: description?.trim() || null,
  };
};

export const removeSkill = async (skillId) => {
  const result = await db
    .updateTable("skill")
    .set({
      skill_status: "archived",
    })
    .where("skill_id", "=", skillId)
    .where("skill_status", "=", "active")
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) {
    throw new Error("Skill not found or already archived.");
  }

  return {
    skill_id: skillId,
  };
};

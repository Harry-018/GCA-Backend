import db from "../config/db.js";

// =====================
// SECTION NAMES
// =====================

export const getSectionNames = async () => {
  return await db
    .selectFrom("section_names as sn")
    .innerJoin(
      "section_name_versions as snv",
      "snv.section_name_id",
      "sn.section_name_id",
    )
    .select([
      "sn.section_name_id",
      "snv.section_name_version_id",
      "snv.section_name",
      "sn.section_name_status",
    ])
    .where("sn.section_name_status", "=", "active")
    .whereRef("snv.section_name", "=", "sn.section_name")
    .orderBy("snv.section_name", "asc")
    .execute();
};

export const getArchivedSectionNames = async () => {
  return await db
    .selectFrom("section_names")
    .selectAll()
    .where("section_name_status", "=", "archived")
    .orderBy("section_name", "asc")
    .execute();
};

export const createSectionName = async (section_name) => {
  const name = section_name.trim();

  if (!name) {
    throw new Error("Section name is required.");
  }

  return await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("section_names")
      .select(["section_name_id", "section_name", "section_name_status"])
      .where("section_name", "=", name)
      .executeTakeFirst();

    if (existing) {
      if (existing.section_name_status === "archived") {
        await trx
          .updateTable("section_names")
          .set({ section_name_status: "active" })
          .where("section_name_id", "=", existing.section_name_id)
          .executeTakeFirst();

        return {
          section_name_id: Number(existing.section_name_id),
          section_name: existing.section_name,
          section_name_status: "active",
          reactivated: true,
        };
      }

      throw new Error("Section name already exists.");
    }

    const result = await trx
      .insertInto("section_names")
      .values({
        section_name: name,
        section_name_status: "active",
      })
      .executeTakeFirst();

    const sectionNameId = Number(result.insertId);

    const versionResult = await trx
      .insertInto("section_name_versions")
      .values({
        section_name_id: sectionNameId,
        section_name: name,
      })
      .executeTakeFirst();

    return {
      section_name_id: sectionNameId,
      section_name_version_id: Number(versionResult.insertId),
      section_name: name,
      section_name_status: "active",
    };
  });
};

export const renameSectionName = async (section_name_id, section_name) => {
  const newName = section_name.trim();

  if (!newName) {
    throw new Error("Section name is required.");
  }

  return await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("section_names")
      .select(["section_name_id", "section_name", "section_name_status"])
      .where("section_name_id", "=", section_name_id)
      .executeTakeFirst();

    if (!existing) {
      throw new Error("Section name not found.");
    }

    const duplicate = await trx
      .selectFrom("section_names")
      .select("section_name_id")
      .where("section_name", "=", newName)
      .where("section_name_id", "!=", section_name_id)
      .executeTakeFirst();

    if (duplicate) {
      throw new Error("Section name already exists.");
    }

    // Don't create a duplicate version if this name
    // already exists in the version history.
    const existingVersion = await trx
      .selectFrom("section_name_versions")
      .select("section_name_version_id")
      .where("section_name_id", "=", section_name_id)
      .where("section_name", "=", newName)
      .executeTakeFirst();

    let sectionNameVersionId = existingVersion?.section_name_version_id;

    if (!existingVersion) {
      const versionResult = await trx
        .insertInto("section_name_versions")
        .values({
          section_name_id,
          section_name: newName,
        })
        .executeTakeFirst();

      sectionNameVersionId = Number(versionResult.insertId);
    }

    await trx
      .updateTable("section_names")
      .set({
        section_name: newName,
      })
      .where("section_name_id", "=", section_name_id)
      .executeTakeFirst();

    return {
      section_name_id: Number(section_name_id),
      section_name_version_id: Number(sectionNameVersionId),
      section_name: newName,
    };
  });
};

export const archiveSectionName = async (section_name_id) => {
  const existing = await db
    .selectFrom("section_names")
    .select(["section_name_id", "section_name", "section_name_status"])
    .where("section_name_id", "=", section_name_id)
    .executeTakeFirst();

  if (!existing) {
    throw new Error("Section name not found.");
  }

  if (existing.section_name_status === "archived") {
    throw new Error("Section name is already archived.");
  }

  await db
    .updateTable("section_names")
    .set({
      section_name_status: "archived",
    })
    .where("section_name_id", "=", section_name_id)
    .executeTakeFirst();

  return {
    section_name_id: Number(section_name_id),
    section_name_status: "archived",
  };
};

export const restoreSectionName = async (section_name_id) => {
  const existing = await db
    .selectFrom("section_names")
    .select(["section_name_id", "section_name", "section_name_status"])
    .where("section_name_id", "=", section_name_id)
    .executeTakeFirst();

  if (!existing) {
    throw new Error("Section name not found.");
  }

  if (existing.section_name_status === "active") {
    throw new Error("Section name is already active.");
  }

  await db
    .updateTable("section_names")
    .set({
      section_name_status: "active",
    })
    .where("section_name_id", "=", section_name_id)
    .executeTakeFirst();

  return {
    section_name_id: Number(section_name_id),
    section_name_status: "active",
  };
};

// =====================
// SUBJECTS
// =====================
export const getAllSubjects = async () => {
  return await db
    .selectFrom("subjects")
    .select(["subject_id", "subject_name"])
    .where("subject_status", "=", "active")
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

export const removeSubject = async (subjectId) => {
  const result = await db
    .updateTable("subjects")
    .set({
      subject_status: "archived",
    })
    .where("subject_id", "=", subjectId)
    .where("subject_status", "=", "active")
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) {
    throw new Error("Subject not found or already archived.");
  }

  return {
    subject_id: subjectId,
  };
};

export const renameSubject = async (subjectId, subjectName) => {
  const newName = subjectName.trim();

  if (!newName) {
    throw new Error("Subject name is required.");
  }

  return await db.transaction().execute(async (trx) => {
    // 1. Check if the subject exists
    const subject = await trx
      .selectFrom("subjects")
      .select(["subject_id", "subject_name"])
      .where("subject_id", "=", subjectId)
      .where("subject_status", "=", "active")
      .executeTakeFirst();

    if (!subject) {
      throw new Error("Subject not found.");
    }

    // 2. Check if another subject already uses this name
    const duplicateSubject = await trx
      .selectFrom("subjects")
      .select("subject_id")
      .where("subject_name", "=", newName)
      .where("subject_id", "!=", subjectId)
      .where("subject_status", "=", "active")
      .executeTakeFirst();

    if (duplicateSubject) {
      throw new Error("Another subject with this name already exists.");
    }

    // 3. Check if this name already exists as a version
    const existingVersion = await trx
      .selectFrom("subject_versions")
      .select("subject_version_id")
      .where("subject_id", "=", subjectId)
      .where("subject_name", "=", newName)
      .executeTakeFirst();

    // 4. Only create a new version if it doesn't already exist
    if (!existingVersion) {
      await trx
        .insertInto("subject_versions")
        .values({
          subject_id: subjectId,
          subject_name: newName,
        })
        .executeTakeFirst();
    }

    // 5. Update the current master subject name
    await trx
      .updateTable("subjects")
      .set({
        subject_name: newName,
      })
      .where("subject_id", "=", subjectId)
      .executeTakeFirst();

    return {
      subject_id: subjectId,
      subject_name: newName,
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

  const name = skill_name.trim();

  const subject = await db
    .selectFrom("subjects")
    .select("subject_id")
    .where("subject_id", "=", subject_id)
    .executeTakeFirst();

  if (!subject) {
    throw new Error("Subject not found.");
  }

  const existingSkill = await db
    .selectFrom("skill")
    .select(["skill_id", "skill_name", "description", "skill_status"])
    .where("subject_id", "=", subject_id)
    .where("skill_name", "=", name)
    .executeTakeFirst();

  if (existingSkill) {
    if (existingSkill.skill_status === "active") {
      throw new Error("Skill already exists for this subject.");
    }

    // Archived skill exists.
    // Reactivate it instead of creating a duplicate.
    await db
      .updateTable("skill")
      .set({
        skill_status: "active",
        description: description?.trim() || null,
      })
      .where("skill_id", "=", existingSkill.skill_id)
      .executeTakeFirst();

    return {
      skill_id: existingSkill.skill_id,
      subject_id,
      skill_name: existingSkill.skill_name,
      description: description?.trim() || null,
      skill_status: "active",
    };
  }

  const result = await db
    .insertInto("skill")
    .values({
      subject_id,
      skill_name: name,
      description: description?.trim() || null,
      skill_status: "active",
    })
    .executeTakeFirst();

  return {
    skill_id: Number(result.insertId),
    subject_id,
    skill_name: name,
    description: description?.trim() || null,
    skill_status: "active",
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

export const getArchivedSkillsBySubject = async (subjectId) => {
  return await db
    .selectFrom("skill")
    .select([
      "skill_id",
      "skill_name",
      "description",
      "subject_id",
      "skill_status",
    ])
    .where("subject_id", "=", subjectId)
    .where("skill_status", "=", "archived")
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

export const reactivateSkill = async (skillId) => {
  const result = await db
    .updateTable("skill")
    .set({
      skill_status: "active",
    })
    .where("skill_id", "=", skillId)
    .where("skill_status", "=", "archived")
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) {
    throw new Error("Skill not found or already active.");
  }

  return {
    skill_id: skillId,
  };
};

import db from "../config/db.js";

import { sql } from "kysely";
import { logAdminActivity } from "./activityLogsModel.js";

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

export const createSchoolYear = async (data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    // 1. Create school year.
    const result = await trx
      .insertInto("school_years")
      .values({
        start_date: data.start_date,
        end_date: data.end_date,
        enrollment_status: data.enrollment_status,
        sy_status: "draft",
      })
      .executeTakeFirst();

    const school_year_id = Number(result.insertId);

    // 2. Get all master grade levels.
    const gradeLevels = await trx
      .selectFrom("grade_levels")
      .select("grade_level_id")
      .execute();

    // 3. Automatically assign all grade levels to the new school year.
    if (gradeLevels.length > 0) {
      await trx
        .insertInto("schoolyears_gradelevels")
        .values(
          gradeLevels.map((grade) => ({
            school_year_id,
            grade_level_id: grade.grade_level_id,
            sy_gradelevel_status: "active",
          })),
        )
        .execute();
    }

    // 4. Generate school-year label.
    const startYear = new Date(data.start_date).getFullYear();
    const endYear = new Date(data.end_date).getFullYear();

    const schoolYearLabel = `${startYear} - ${endYear}`;

    // 5. Log activity.
    await logAdminActivity(
      {
        user_id,
        user_action: "Created",
        user_module: "School Years",
        description: `Created school year ${schoolYearLabel} with ${gradeLevels.length} grade level(s) automatically assigned.`,
      },
      trx,
    );

    return {
      school_year_id,
      assigned_grade_levels: gradeLevels.length,
    };
  });
};

export const editSchoolYear = async (school_year_id, data, user_id) => {
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

    const startYear = new Date(data.start_date).getFullYear();
    const endYear = new Date(data.end_date).getFullYear();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "School Years",
        description: `Updated school year ${startYear} - ${endYear} (Status: ${data.sy_status}, Enrollment: ${data.enrollment_status}).`,
      },
      trx,
    );

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

export const createGradeLevel = async (data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const result = await trx
      .insertInto("grade_levels")
      .values({
        grade_level_name: data.grade_level_name,
      })
      .executeTakeFirst();

    const grade_level_id = Number(result.insertId);

    await logAdminActivity(
      {
        user_id,
        user_action: "Created",
        user_module: "Grade Levels",
        description: `Created grade level "${data.grade_level_name}".`,
      },
      trx,
    );

    return { grade_level_id };
  });
};

export const editGradeLevel = async (grade_level_id, data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("grade_levels")
      .select(["grade_level_id", "grade_level_name"])
      .where("grade_level_id", "=", grade_level_id)
      .executeTakeFirst();

    if (!existing) {
      throw new Error("Grade level not found.");
    }

    await trx
      .updateTable("grade_levels")
      .set({
        grade_level_name: data.grade_level_name,
      })
      .where("grade_level_id", "=", grade_level_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Grade Levels",
        description: `Updated grade level "${existing.grade_level_name}" to "${data.grade_level_name}".`,
      },
      trx,
    );

    return {
      grade_level_id: Number(grade_level_id),
    };
  });
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

export const getGradelevelsInSchoolyear = async (school_year_id = null) => {
  let query = db
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
    .where("sgl.sy_gradelevel_status", "=", "active");

  if (school_year_id) {
    query = query.where("sy.school_year_id", "=", Number(school_year_id));
  } else {
    query = query.where("sy.sy_status", "=", "active");
  }

  return await query
    .groupBy([
      "gl.grade_level_id",
      "gl.grade_level_name",
      "sgl.sy_grade_level_id",
    ])
    .orderBy("gl.grade_level_id", "asc")
    .execute();
};

export const addGradelevelsToSchoolYears = async (data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const school_year_id = Number(data.school_year_id);
    const grade_level_id = Number(data.grade_level_id);

    if (!school_year_id || !grade_level_id) {
      throw new Error("School year and grade level are required.");
    }

    const schoolYear = await trx
      .selectFrom("school_years")
      .select(["school_year_id", "start_date", "end_date"])
      .where("school_year_id", "=", school_year_id)
      .executeTakeFirst();

    if (!schoolYear) {
      throw new Error("School year not found.");
    }

    const gradeLevel = await trx
      .selectFrom("grade_levels")
      .select(["grade_level_id", "grade_level_name"])
      .where("grade_level_id", "=", grade_level_id)
      .executeTakeFirst();

    if (!gradeLevel) {
      throw new Error("Grade level not found.");
    }

    const getYear = (date) => {
      if (date instanceof Date) {
        return date.getUTCFullYear();
      }

      return Number(String(date).slice(0, 4));
    };

    const startYear = getYear(schoolYear.start_date);
    const endYear = getYear(schoolYear.end_date);

    const schoolYearLabel = `${startYear} - ${endYear}`;

    const existing = await trx
      .selectFrom("schoolyears_gradelevels")
      .select(["sy_grade_level_id", "sy_gradelevel_status"])
      .where("school_year_id", "=", school_year_id)
      .where("grade_level_id", "=", grade_level_id)
      .executeTakeFirst();

    if (existing) {
      // Already active: nothing changed, so no activity log.
      if (existing.sy_gradelevel_status === "active") {
        return {
          sy_grade_level_id: Number(existing.sy_grade_level_id),
        };
      }

      // Reactivate an archived assignment.
      await trx
        .updateTable("schoolyears_gradelevels")
        .set({ sy_gradelevel_status: "active" })
        .where("sy_grade_level_id", "=", existing.sy_grade_level_id)
        .executeTakeFirst();

      await logAdminActivity(
        {
          user_id,
          user_action: "Updated",
          user_module: "Grade Levels",
          description: `Reactivated grade level "${gradeLevel.grade_level_name}" for school year ${schoolYearLabel}.`,
        },
        trx,
      );

      return {
        sy_grade_level_id: Number(existing.sy_grade_level_id),
      };
    }

    // Create a new assignment.
    const result = await trx
      .insertInto("schoolyears_gradelevels")
      .values({
        school_year_id,
        grade_level_id,
        sy_gradelevel_status: "active",
      })
      .executeTakeFirst();

    const sy_grade_level_id = Number(result.insertId);

    await logAdminActivity(
      {
        user_id,
        user_action: "Created",
        user_module: "School Years",
        description: `Added grade level "${gradeLevel.grade_level_name}" to school year ${schoolYearLabel}.`,
      },
      trx,
    );

    return { sy_grade_level_id };
  });
};

export const removeGradeLevelFromSchoolYear = async (data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const school_year_id = Number(data.school_year_id);
    const grade_level_id = Number(data.grade_level_id);

    if (!school_year_id || !grade_level_id) {
      throw new Error("School year and grade level are required.");
    }

    const schoolYear = await trx
      .selectFrom("school_years")
      .select(["school_year_id", "start_date", "end_date"])
      .where("school_year_id", "=", school_year_id)
      .executeTakeFirst();

    if (!schoolYear) {
      throw new Error("School year not found.");
    }
    const getYear = (date) => {
      if (date instanceof Date) {
        return date.getUTCFullYear();
      }

      return Number(String(date).slice(0, 4));
    };

    const startYear = getYear(schoolYear.start_date);
    const endYear = getYear(schoolYear.end_date);

    const schoolYearLabel = `${startYear} - ${endYear}`;

    const applications = await trx
      .selectFrom("applications")
      .select("application_id")
      .where("grade_level_id", "=", grade_level_id)
      .where("school_year_id", "=", school_year_id)
      .executeTakeFirst();

    if (applications) {
      throw new Error(
        "Grade level cannot be removed because it is already being used.",
      );
    }

    const gradeLevel = await trx
      .selectFrom("schoolyears_gradelevels as sygl")
      .innerJoin(
        "grade_levels as gl",
        "gl.grade_level_id",
        "sygl.grade_level_id",
      )
      .select(["sygl.sy_grade_level_id", "gl.grade_level_name"])
      .where("sygl.grade_level_id", "=", grade_level_id)
      .where("sygl.school_year_id", "=", school_year_id)
      .where("sygl.sy_gradelevel_status", "=", "active")
      .executeTakeFirst();

    if (!gradeLevel) {
      throw new Error("Grade level is not assigned to this school year.");
    }

    await trx
      .updateTable("schoolyears_gradelevels")
      .set({ sy_gradelevel_status: "archived" })
      .where("sy_grade_level_id", "=", gradeLevel.sy_grade_level_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Grade Levels",
        description: `Removed grade level "${gradeLevel.grade_level_name}" from school year ${schoolYearLabel} (assignment archived).`,
      },
      trx,
    );

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

export const addSubjectsToGradeLevel = async (data, user_id) => {
  const sy_grade_level_id = Number(data.sy_grade_level_id);

  const subject_ids = [
    ...new Set(data.subject_ids.map((subject_id) => Number(subject_id))),
  ];

  return await db.transaction().execute(async (trx) => {
    // 1. Retrieve the three master quarters
    const quarters = await trx
      .selectFrom("quarter")
      .select("quarter_id")
      .orderBy("quarter_id", "asc")
      .execute();

    if (quarters.length !== 3) {
      throw new Error(
        "The 3 grading quarters must be configured before assigning subjects.",
      );
    }

    // 2. Validate selected subjects
    const subjects = await trx
      .selectFrom("subjects as s")
      .innerJoin("subject_versions as sv", "sv.subject_id", "s.subject_id")
      .select([
        "s.subject_id",
        "s.subject_name as subject_name",
        "sv.subject_version_id",
      ])
      .where("s.subject_id", "in", subject_ids)
      .where("s.subject_status", "=", "active")
      .whereRef("sv.subject_name", "=", "s.subject_name")
      .execute();

    if (subjects.length !== subject_ids.length) {
      throw new Error("One or more subjects were not found.");
    }

    // 3. Retrieve existing subject assignments
    const existingAssignments = await trx
      .selectFrom("schoolyears_gradelevels_subjects")
      .select([
        "sy_gradelevel_subject_id",
        "subject_id",
        "subject_version_id",
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

    // 4. Determine which subjects need insertion or restoration
    for (const subject of subjects) {
      const existing = existingMap.get(Number(subject.subject_id));

      if (!existing) {
        subjectsToInsert.push({
          sy_grade_level_id,
          subject_id: Number(subject.subject_id),
          subject_version_id: Number(subject.subject_version_id),
          sy_gradelevel_subject_status: "active",
        });
      } else if (existing.sy_gradelevel_subject_status === "archived") {
        subjectsToReactivate.push({
          sy_gradelevel_subject_id: Number(existing.sy_gradelevel_subject_id),
          subject_version_id: Number(subject.subject_version_id),
        });
      }
    }

    // 5. Reactivate archived subjects
    for (const subject of subjectsToReactivate) {
      await trx
        .updateTable("schoolyears_gradelevels_subjects")
        .set({
          sy_gradelevel_subject_status: "active",
          subject_version_id: subject.subject_version_id,
        })
        .where(
          "sy_gradelevel_subject_id",
          "=",
          subject.sy_gradelevel_subject_id,
        )
        .executeTakeFirst();
    }

    // 6. Insert new subject assignments
    if (subjectsToInsert.length > 0) {
      await trx
        .insertInto("schoolyears_gradelevels_subjects")
        .values(subjectsToInsert)
        .execute();
    }

    // 7. Retrieve all active subject assignments
    const activeAssignments = await trx
      .selectFrom("schoolyears_gradelevels_subjects")
      .select("sy_gradelevel_subject_id")
      .where("sy_grade_level_id", "=", sy_grade_level_id)
      .where("subject_id", "in", subject_ids)
      .where("sy_gradelevel_subject_status", "=", "active")
      .execute();

    // 8. Retrieve existing quarter assignments
    const assignmentIds = activeAssignments.map((item) =>
      Number(item.sy_gradelevel_subject_id),
    );

    const existingQuarterAssignments = assignmentIds.length
      ? await trx
          .selectFrom("quarter_subjects")
          .select(["quarter_id", "sy_gradelevel_subject_id"])
          .where("sy_gradelevel_subject_id", "in", assignmentIds)
          .execute()
      : [];

    const existingQuarterMap = new Set(
      existingQuarterAssignments.map(
        (item) =>
          `${Number(item.sy_gradelevel_subject_id)}-${Number(item.quarter_id)}`,
      ),
    );

    // 9. Generate missing quarter assignments
    const quarterAssignments = [];

    for (const assignment of activeAssignments) {
      for (const quarter of quarters) {
        const key = `${Number(assignment.sy_gradelevel_subject_id)}-${Number(quarter.quarter_id)}`;

        if (!existingQuarterMap.has(key)) {
          quarterAssignments.push({
            sy_gradelevel_subject_id: Number(
              assignment.sy_gradelevel_subject_id,
            ),
            quarter_id: Number(quarter.quarter_id),
          });
        }
      }
    }

    // 10. Insert missing quarter assignments
    if (quarterAssignments.length > 0) {
      await trx
        .insertInto("quarter_subjects")
        .values(quarterAssignments)
        .execute();
    }

    // 11. Log only if subjects were actually added or reactivated
    const changedSubjectIds = [
      ...subjectsToInsert.map((subject) => subject.subject_id),
      ...subjectsToReactivate.map((subject) => {
        const assignment = existingAssignments.find(
          (item) =>
            Number(item.sy_gradelevel_subject_id) ===
            subject.sy_gradelevel_subject_id,
        );

        return Number(assignment.subject_id);
      }),
    ];

    if (changedSubjectIds.length > 0) {
      const changedSubjectNames = subjects
        .filter((subject) =>
          changedSubjectIds.includes(Number(subject.subject_id)),
        )
        .map((subject) => subject.subject_name);

      const gradeLevel = await trx
        .selectFrom("schoolyears_gradelevels as sygl")
        .innerJoin(
          "grade_levels as gl",
          "gl.grade_level_id",
          "sygl.grade_level_id",
        )
        .select("gl.grade_level_name")
        .where("sygl.sy_grade_level_id", "=", sy_grade_level_id)
        .executeTakeFirst();

      if (!gradeLevel) {
        throw new Error("Grade-level configuration not found.");
      }

      await logAdminActivity(
        {
          user_id,
          user_action: subjectsToInsert.length > 0 ? "Created" : "Updated",
          user_module: "Grade Levels",
          description: `Assigned ${changedSubjectNames.join(", ")} to grade-level ${gradeLevel.grade_level_name}.`,
        },
        trx,
      );
    }

    return {
      inserted: subjectsToInsert.length,
      reactivated: subjectsToReactivate.length,
      skipped:
        subject_ids.length -
        subjectsToInsert.length -
        subjectsToReactivate.length,
      quarter_assignments_created: quarterAssignments.length,
      subject_ids: subjectsToInsert.map((subject) => subject.subject_id),
    };
  });
};

export const removeSubjectFromGradeLevel = async (
  sy_gradelevel_subject_id,
  user_id,
) => {
  return await db.transaction().execute(async (trx) => {
    const assignment = await trx
      .selectFrom("schoolyears_gradelevels_subjects as sgs")
      .innerJoin("subjects as s", "s.subject_id", "sgs.subject_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sgs.sy_grade_level_id",
      )
      .innerJoin(
        "grade_levels as gl",
        "gl.grade_level_id",
        "sygl.grade_level_id",
      )
      .select([
        "sgs.sy_gradelevel_subject_id",
        "sgs.sy_gradelevel_subject_status",
        "s.subject_name",
        "gl.grade_level_name",
      ])
      .where("sgs.sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .executeTakeFirst();

    if (!assignment) {
      throw new Error("Subject assignment not found.");
    }

    if (assignment.sy_gradelevel_subject_status !== "active") {
      throw new Error("Subject assignment is already archived.");
    }

    await trx
      .updateTable("schoolyears_gradelevels_subjects")
      .set({
        sy_gradelevel_subject_status: "archived",
      })
      .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Grade Levels",
        description: `Removed ${assignment.subject_name} from grade-level ${assignment.grade_level_name}.`,
      },
      trx,
    );

    return {
      sy_gradelevel_subject_id: Number(sy_gradelevel_subject_id),
    };
  });
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
export const addSkillToSubject = async (subject_id, data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const subject = await trx
      .selectFrom("subjects")
      .select(["subject_id", "subject_name"])
      .where("subject_id", "=", subject_id)
      .executeTakeFirst();

    if (!subject) {
      throw new Error("Subject not found.");
    }

    const result = await trx
      .insertInto("skill")
      .values({
        skill_name: data.skill_name,
        description: data.description,
        subject_id,
      })
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Created",
        user_module: "Settings",
        description: `Created master skill "${data.skill_name}" under subject "${subject.subject_name}".`,
      },
      trx,
    );

    return result;
  });
};

//assign skill to subject not create
export const assignSkillsToGradeLevelSubject = async (
  sy_gradelevel_subject_id,
  skill_ids,
  user_id,
) => {
  const uniqueSkillIds = [
    ...new Set(skill_ids.map((skill_id) => Number(skill_id))),
  ];

  return await db.transaction().execute(async (trx) => {
    // 1. Retrieve the grade-level subject and grade-level name
    const gradeLevelSubject = await trx
      .selectFrom("schoolyears_gradelevels_subjects as sgs")
      .innerJoin("subjects as s", "s.subject_id", "sgs.subject_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sgs.sy_grade_level_id",
      )
      .innerJoin(
        "grade_levels as gl",
        "gl.grade_level_id",
        "sygl.grade_level_id",
      )
      .select(["sgs.subject_id", "s.subject_name", "gl.grade_level_name"])
      .where("sgs.sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .executeTakeFirst();

    if (!gradeLevelSubject) {
      throw new Error("Grade-level subject not found.");
    }

    // 2. Validate selected skills
    const skills = await trx
      .selectFrom("skill")
      .select(["skill_id", "skill_name"])
      .where("skill_id", "in", uniqueSkillIds)
      .where("subject_id", "=", gradeLevelSubject.subject_id)
      .execute();

    if (skills.length !== uniqueSkillIds.length) {
      throw new Error(
        "One or more selected skills do not belong to this subject.",
      );
    }

    // 3. Find existing assignments
    const existingAssignments = await trx
      .selectFrom("schoolyears_gradelevels_subjects_skills")
      .select(["skill_id", "skill_status"])
      .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .where("skill_id", "in", uniqueSkillIds)
      .execute();

    const existingMap = new Map(
      existingAssignments.map((item) => [
        Number(item.skill_id),
        item.skill_status,
      ]),
    );

    const skillsToInsert = [];
    const skillsToRestore = [];
    const skillsToSkip = [];

    // 4. Determine changes
    for (const skill_id of uniqueSkillIds) {
      const existingStatus = existingMap.get(skill_id);

      if (!existingStatus) {
        skillsToInsert.push(skill_id);
      } else if (existingStatus === "archived") {
        skillsToRestore.push(skill_id);
      } else {
        skillsToSkip.push(skill_id);
      }
    }

    // 5. Restore archived assignments
    if (skillsToRestore.length > 0) {
      await trx
        .updateTable("schoolyears_gradelevels_subjects_skills")
        .set({ skill_status: "active" })
        .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
        .where("skill_id", "in", skillsToRestore)
        .execute();
    }

    // 6. Insert new assignments
    if (skillsToInsert.length > 0) {
      const values = skillsToInsert.map((skill_id) => ({
        sy_gradelevel_subject_id,
        skill_id,
        skill_status: "active",
      }));

      await trx
        .insertInto("schoolyears_gradelevels_subjects_skills")
        .values(values)
        .execute();
    }

    // 7. Log actual changes
    const changedSkillIds = [...skillsToInsert, ...skillsToRestore];

    if (changedSkillIds.length > 0) {
      const changedSkillNames = skills
        .filter((skill) => changedSkillIds.includes(Number(skill.skill_id)))
        .map((skill) => skill.skill_name);

      await logAdminActivity(
        {
          user_id,
          user_action: skillsToInsert.length > 0 ? "Created" : "Updated",
          user_module: "Grade Levels",
          description: `Assigned ${changedSkillNames.join(", ")} to ${gradeLevelSubject.subject_name} under grade-level ${gradeLevelSubject.grade_level_name}.`,
        },
        trx,
      );
    }

    return {
      inserted: skillsToInsert.length,
      restored: skillsToRestore.length,
      skipped: skillsToSkip.length,
      inserted_skill_ids: skillsToInsert,
      restored_skill_ids: skillsToRestore,
      skipped_skill_ids: skillsToSkip,
    };
  });
};
//edit master skill
export const editSkill = async (subject_id, skill_id, data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("skill")
      .select(["skill_id", "skill_name", "description"])
      .where("skill_id", "=", skill_id)
      .where("subject_id", "=", subject_id)
      .executeTakeFirst();

    if (!existing) {
      throw new Error("Skill not found.");
    }

    const result = await trx
      .updateTable("skill")
      .set({
        skill_name: data.skill_name,
        description: data.description,
      })
      .where("skill_id", "=", skill_id)
      .where("subject_id", "=", subject_id)
      .executeTakeFirst();

    const subject = await trx
      .selectFrom("subjects")
      .select("subject_name")
      .where("subject_id", "=", subject_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Settings",
        description: `Updated master skill "${existing.skill_name}" to "${data.skill_name}" under subject "${subject?.subject_name}".`,
      },
      trx,
    );

    return result;
  });
};

export const archiveSkill = async (
  sy_gradelevel_subject_id,
  skill_id,
  user_id,
) => {
  return await db.transaction().execute(async (trx) => {
    const assignment = await trx
      .selectFrom("schoolyears_gradelevels_subjects_skills as sgss")
      .innerJoin("skill as sk", "sk.skill_id", "sgss.skill_id")
      .innerJoin(
        "schoolyears_gradelevels_subjects as sgs",
        "sgs.sy_gradelevel_subject_id",
        "sgss.sy_gradelevel_subject_id",
      )
      .innerJoin("subjects as s", "s.subject_id", "sgs.subject_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sgs.sy_grade_level_id",
      )
      .innerJoin(
        "grade_levels as gl",
        "gl.grade_level_id",
        "sygl.grade_level_id",
      )
      .select([
        "sgss.skill_status",
        "sk.skill_name",
        "s.subject_name",
        "gl.grade_level_name",
      ])
      .where("sgss.sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .where("sgss.skill_id", "=", skill_id)
      .executeTakeFirst();

    if (!assignment) {
      throw new Error("Skill assignment not found.");
    }

    if (assignment.skill_status === "archived") {
      throw new Error("Skill assignment is already archived.");
    }

    await trx
      .updateTable("schoolyears_gradelevels_subjects_skills")
      .set({ skill_status: "archived" })
      .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .where("skill_id", "=", skill_id)
      .execute();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Grade Levels",
        description: `Removed ${assignment.skill_name} from ${assignment.subject_name} under grade-level ${assignment.grade_level_name}.`,
      },
      trx,
    );

    return true;
  });
};
// Restore a skill assignment
export const restoreSkill = async (
  sy_gradelevel_subject_id,
  skill_id,
  user_id,
) => {
  return await db.transaction().execute(async (trx) => {
    const assignment = await trx
      .selectFrom("schoolyears_gradelevels_subjects_skills as sgss")
      .innerJoin("skill as sk", "sk.skill_id", "sgss.skill_id")
      .innerJoin(
        "schoolyears_gradelevels_subjects as sgs",
        "sgs.sy_gradelevel_subject_id",
        "sgss.sy_gradelevel_subject_id",
      )
      .innerJoin("subjects as s", "s.subject_id", "sgs.subject_id")
      .innerJoin(
        "schoolyears_gradelevels as sygl",
        "sygl.sy_grade_level_id",
        "sgs.sy_grade_level_id",
      )
      .innerJoin(
        "grade_levels as gl",
        "gl.grade_level_id",
        "sygl.grade_level_id",
      )
      .select([
        "sgss.skill_status",
        "sk.skill_name",
        "s.subject_name",
        "gl.grade_level_name",
      ])
      .where("sgss.sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .where("sgss.skill_id", "=", skill_id)
      .executeTakeFirst();

    if (!assignment) {
      throw new Error("Skill assignment not found.");
    }

    if (assignment.skill_status === "active") {
      throw new Error("Skill assignment is already active.");
    }

    await trx
      .updateTable("schoolyears_gradelevels_subjects_skills")
      .set({ skill_status: "active" })
      .where("sy_gradelevel_subject_id", "=", sy_gradelevel_subject_id)
      .where("skill_id", "=", skill_id)
      .execute();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Grade Levels",
        description: `Restored ${assignment.skill_name} under ${assignment.subject_name} for grade-level ${assignment.grade_level_name}.`,
      },
      trx,
    );

    return true;
  });
};

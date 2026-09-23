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
export const getSubjectsInGradeLevel = async (sy_grade_level_id) => {
  return await db
    .selectFrom("schoolyears_gradelevels_subjects as sgls")
    .innerJoin("subjects as s", "sgls.subject_id", "s.subject_id")
    .select(["sgls.sy_gradelevel_subject_id", "s.subject_id", "s.subject_name"])
    .where("sgls.sy_grade_level_id", "=", sy_grade_level_id)
    .where("sgls.sy_gradelevel_subject_status", "=", "active")
    .execute();
};

export const addSubjectToGradeLevel = async (data) => {
  const existing = await db
    .selectFrom("schoolyears_gradelevels_subjects")
    .select(["sy_gradelevel_subject_id", "sy_gradelevel_subject_status"])
    .where("sy_grade_level_id", "=", data.sy_grade_level_id)
    .where("subject_id", "=", data.subject_id)
    .executeTakeFirst();

  // Assignment already exists
  if (existing) {
    // Reactivate if archived
    if (existing.sy_gradelevel_subject_status === "archived") {
      await db
        .updateTable("schoolyears_gradelevels_subjects")
        .set({
          sy_gradelevel_subject_status: "active",
        })
        .where(
          "sy_gradelevel_subject_id",
          "=",
          existing.sy_gradelevel_subject_id,
        )
        .executeTakeFirst();
    }

    return {
      sy_gradelevel_subject_id: Number(existing.sy_gradelevel_subject_id),
    };
  }

  // No existing assignment, create a new one
  const result = await db
    .insertInto("schoolyears_gradelevels_subjects")
    .values({
      sy_grade_level_id: data.sy_grade_level_id,
      subject_id: data.subject_id,
      sy_gradelevel_subject_status: "active",
    })
    .executeTakeFirst();

  return {
    sy_gradelevel_subject_id: Number(result.insertId),
  };
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

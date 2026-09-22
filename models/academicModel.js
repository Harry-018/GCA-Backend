import db from "../config/db.js";

export const getSchoolYears = async () => {
  return await db
    .selectFrom("school_years")
    .selectAll()
    .orderBy("start_date", "desc")
    .execute();
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
  const availableGradeLevels = await db
    .selectFrom("schoolyears_gradelevels as sgl")

    .innerJoin("school_years as sy", "sgl.school_year_id", "sy.school_year_id")

    .innerJoin("grade_levels as gl", "sgl.grade_level_id", "gl.grade_level_id")

    .select(["gl.grade_level_id", "gl.grade_level_name"])

    .where("sy.sy_status", "=", "active")
    .execute();

  return availableGradeLevels;
};

export const addGradelevelsToSchoolYears = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const activeSY = await trx
      .selectFrom("school_years")
      .selectAll()
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!activeSY) {
      throw new Error("No active school year found.");
    }
    const activeSY_id = Number(activeSY.school_year_id);

    const result = await trx
      .insertInto("schoolyears_gradelevels")
      .values({
        school_year_id: activeSY_id,
        grade_level_id: data.grade_level_id,
        sy_gradelevel_status: data.sy_gradelevel_status,
      })
      .execute();

    return { sy_gradelevel_id: Number(result.insertId) };
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

    await trx
      .deleteFrom("schoolyears_gradelevels")
      .where("grade_level_id", "=", data.grade_level_id)
      .where("school_year_id", "=", activeSchoolYearId)
      .execute();
  });
};

import db from "../config/db.js";
import { sql } from "kysely";

export const getTeachers = async ({
  status = "all",
  search = "",
  page = 1,
  limit = 10,
}) => {
  const offset = (page - 1) * limit;

  let query = db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin(
      "teacher_address as ta",
      "ti.teacher_address_id",
      "ta.address_id",
    )
    .select([
      "t.teacher_id",
      "t.teacher_num",
      "t.teacher_status",

      "ti.teacher_info_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "ti.gender",
      "ti.bdate",
      "ti.birthplace",
      "ti.religion",
      "ti.civil_status",
      "ti.contact_num",
      "ti.email",

      "ta.address_id",
      "ta.province",
      "ta.zipcode",
      "ta.city_municipality",
      "ta.house_no",
      "ta.barangay",
    ]);

  if (status && status !== "all") {
    query = query.where("t.teacher_status", "=", status);
  }

  if (search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;

    query = query.where((eb) =>
      eb.or([
        sql`LOWER(${sql.ref("ti.first_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.middle_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.last_name")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("t.teacher_num")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.email")}) LIKE ${term}`,
        sql`LOWER(${sql.ref("ti.contact_num")}) LIKE ${term}`,
      ]),
    );
  }

  const countResult = await query
    .clearSelect()
    .clearOrderBy()
    .select((eb) => eb.fn.count("t.teacher_id").as("total"))
    .executeTakeFirst();

  const total = Number(countResult?.total ?? 0);

  const teachers = await query
    .orderBy("ti.last_name", "asc")
    .orderBy("ti.first_name", "asc")
    .limit(limit)
    .offset(offset)
    .execute();

  return {
    data: teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTeacherInfo = async (teacher_id) => {
  const teacher = await db
    .selectFrom("teachers as t")
    .innerJoin("teacher_info as ti", "t.teacher_info_id", "ti.teacher_info_id")
    .innerJoin(
      "teacher_address as ta",
      "ti.teacher_address_id",
      "ta.address_id",
    )
    .select([
      "t.teacher_id",
      "t.teacher_num",
      "t.teacher_status",

      "ti.teacher_info_id",
      "ti.first_name",
      "ti.middle_name",
      "ti.last_name",
      "ti.gender",
      "ti.bdate",
      "ti.birthplace",
      "ti.religion",
      "ti.civil_status",
      "ti.contact_num",
      "ti.email",
      "ti.user_id",

      "ta.address_id",
      "ta.province",
      "ta.zipcode",
      "ta.city_municipality",
      "ta.house_no",
      "ta.barangay",
    ])
    .where("t.teacher_id", "=", teacher_id)
    .executeTakeFirst();

  return teacher;
};

export const createTeacher = async (data) => {
  return await db.transaction().execute(async (trx) => {
    // 1. Create address
    const addressResult = await trx
      .insertInto("teacher_address")
      .values({
        province: data.province,
        zipcode: data.zipcode,
        city_municipality: data.city_municipality,
        house_no: data.house_no,
        barangay: data.barangay,
      })
      .executeTakeFirst();

    const address_id = Number(addressResult.insertId);

    // 2. Create user account
    const accountResult = await trx
      .insertInto("user_accounts")
      .values({
        email: data.account_email,
        password: data.password ?? null,
        first_name: data.first_name,
        last_name: data.last_name,
        role: "teacher",
        account_status: data.account_status ?? "pending",
        created_at: new Date(),
      })
      .executeTakeFirst();

    const user_id = Number(accountResult.insertId);

    // 3. Create teacher information
    const teacherInfoResult = await trx
      .insertInto("teacher_info")
      .values({
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name ?? null,
        gender: data.gender,
        bdate: data.bdate,
        birthplace: data.birthplace,
        religion: data.religion,
        civil_status: data.civil_status,
        contact_num: data.contact_num ?? null,
        email: data.email ?? null,
        teacher_address_id: address_id,
        user_id,
      })
      .executeTakeFirst();

    const teacher_info_id = Number(teacherInfoResult.insertId);

    // 4. Create teacher record
    const teacherResult = await trx
      .insertInto("teachers")
      .values({
        teacher_info_id,
        teacher_num: data.teacher_num ?? null,
        teacher_status: data.teacher_status ?? "active",
      })
      .executeTakeFirst();

    const teacher_id = Number(teacherResult.insertId);

    return {
      teacher_id,
      teacher_info_id,
      user_id,
      address_id,
    };
  });
};

export const updateTeacher = async (teacher_id, data) => {
  return await db.transaction().execute(async (trx) => {
    // Find existing teacher
    const teacher = await trx
      .selectFrom("teachers as t")
      .innerJoin(
        "teacher_info as ti",
        "t.teacher_info_id",
        "ti.teacher_info_id",
      )
      .select([
        "t.teacher_id",
        "t.teacher_info_id",
        "ti.teacher_address_id",
        "ti.user_id",
      ])
      .where("t.teacher_id", "=", teacher_id)
      .executeTakeFirst();

    if (!teacher) {
      return null;
    }

    // Update teacher information
    await trx
      .updateTable("teacher_info")
      .set({
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name ?? null,
        gender: data.gender,
        bdate: data.bdate,
        birthplace: data.birthplace,
        religion: data.religion,
        civil_status: data.civil_status,
        contact_num: data.contact_num ?? null,
        email: data.email ?? null,
      })
      .where("teacher_info_id", "=", teacher.teacher_info_id)
      .execute();

    // Update address
    await trx
      .updateTable("teacher_address")
      .set({
        province: data.province,
        zipcode: data.zipcode,
        city_municipality: data.city_municipality,
        house_no: data.house_no,
        barangay: data.barangay,
      })
      .where("address_id", "=", teacher.teacher_address_id)
      .execute();

    // Update teacher-specific fields
    await trx
      .updateTable("teachers")
      .set({
        teacher_num: data.teacher_num ?? null,
        teacher_status: data.teacher_status,
      })
      .where("teacher_id", "=", teacher_id)
      .execute();

    // Update account-level name/email if provided
    if (data.account_email || data.first_name || data.last_name) {
      const accountUpdate = {};

      if (data.account_email) {
        accountUpdate.email = data.account_email;
      }

      if (data.first_name) {
        accountUpdate.first_name = data.first_name;
      }

      if (data.last_name) {
        accountUpdate.last_name = data.last_name;
      }

      await trx
        .updateTable("user_accounts")
        .set(accountUpdate)
        .where("user_id", "=", teacher.user_id)
        .execute();
    }

    return {
      teacher_id,
    };
  });
};

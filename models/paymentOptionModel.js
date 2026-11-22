import db from "../config/db.js";
import { logAdminActivity } from "./activityLogsModel.js";

// payment option
export const getPaymentOptions = async () => {
  return await db.selectFrom("payment_option").selectAll().execute();
};

export const editPaymentOption = async (payment_option_id, data, user_id) => {
  const result = await db
    .updateTable("payment_option")
    .set({
      option_name: data.option_name,
      due_date_display: data.due_date_display,
    })
    .where("payment_option_id", "=", payment_option_id)
    .executeTakeFirst();

  if (Number(result.numUpdatedRows) === 0) {
    throw new Error("Payment option not found");
  }

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Payment Options",
    description: `Updated payment option "${data.option_name}".`,
  });

  return { payment_option_id: Number(payment_option_id) };
};

//gl paymentoptions
export const getFeesInGradeLevels = async (grade_level_id) => {
  const activeSY = await db
    .selectFrom("school_years")
    .select("school_year_id")
    .where("sy_status", "=", "active")
    .executeTakeFirst();

  if (!activeSY) {
    throw new Error("No active school year found");
  }

  const getFeesId = await db
    .selectFrom("gradelevel_paymentoptions")
    .select("fees_id")
    .where("grade_level_id", "=", grade_level_id)
    .where("school_year_id", "=", activeSY.school_year_id)
    .executeTakeFirst();

  if (!getFeesId) {
    throw new Error("No fee setup found for this grade level and school year");
  }

  return await db
    .selectFrom("fees")
    .selectAll()
    .where("fees_id", "=", getFeesId.fees_id)
    .executeTakeFirst();
};

export const getPaymentOptionsInGradeLevels = async (grade_level_id) => {
  return await db
    .selectFrom("gradelevel_paymentoptions as gpo")
    .innerJoin(
      "payment_option as po",
      "po.payment_option_id",
      "gpo.payment_option_id",
    )
    .select([
      "gpo.gradelevel_paymentoption_id",
      "po.option_name",
      "po.due_date_display",
      "gpo.amount",
      "gpo.discount",
    ])
    .where("gpo.grade_level_id", "=", Number(grade_level_id))
    .execute();
};

export const addFeesPaymentInGradeLevel = async (data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const selectActiveSY = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!selectActiveSY) {
      throw new Error("No active school year found");
    }
    const activeSY_id = selectActiveSY.school_year_id;

    const insertToFees = await trx
      .insertInto("fees")
      .values({
        miscel_fee: data.miscel_fee,
        books: data.books,
        uniform_boys: data.uniform_boys,
        uniform_girls: data.uniform_girls,
        pe_uniform_boys: data.pe_uniform_boys,
        pe_uniform_girls: data.pe_uniform_girls,
      })
      .executeTakeFirst();

    const fee_id = Number(insertToFees.insertId);

    const paymentOptions = await trx
      .selectFrom("payment_option")
      .select("payment_option_id")
      .execute();

    if (paymentOptions.length === 0) {
      throw new Error("No payment options exist to assign");
    }

    const rows = paymentOptions.map((option) => ({
      grade_level_id: data.grade_level_id,
      payment_option_id: option.payment_option_id,
      discount: data.discount,
      amount: data.amount,
      fees_id: fee_id,
      school_year_id: activeSY_id,
    }));

    const inserted = await trx
      .insertInto("gradelevel_paymentoptions")
      .values(rows)
      .execute();

    const gradeLevel = await trx
      .selectFrom("grade_levels")
      .select("grade_level_name")
      .where("grade_level_id", "=", data.grade_level_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Created",
        user_module: "Tuition",
        description: `Created fees for grade level "${gradeLevel?.grade_level_name || "the selected grade level"}".`,
      },
      trx,
    );

    return {
      fees_id: fee_id,
      grade_level_id: data.grade_level_id,
      count: rows.length,
    };
  });
};

export const editGradeLevelFees = async (grade_level_id, data, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const selectActiveSY = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!selectActiveSY) {
      throw new Error("No active school year found");
    }
    const activeSY_id = selectActiveSY.school_year_id;

    const selectGradeLevel = await trx
      .selectFrom("gradelevel_paymentoptions")
      .select("fees_id")
      .where("grade_level_id", "=", grade_level_id)
      .where("school_year_id", "=", activeSY_id)
      .executeTakeFirst();

    if (!selectGradeLevel) {
      throw new Error("No grade level found");
    }

    const updateFees = await trx
      .updateTable("fees")
      .set({
        miscel_fee: data.miscel_fee,
        books: data.books,
        uniform_boys: data.uniform_boys,
        uniform_girls: data.uniform_girls,
        pe_uniform_boys: data.pe_uniform_boys,
        pe_uniform_girls: data.pe_uniform_girls,
      })
      .where("fees_id", "=", selectGradeLevel.fees_id)
      .executeTakeFirst();

    if (Number(updateFees.numUpdatedRows) === 0) {
      throw new Error("Fee record not found or nothing changed");
    }

    const gradeLevel = await trx
      .selectFrom("grade_levels")
      .select("grade_level_name")
      .where("grade_level_id", "=", grade_level_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Updated",
        user_module: "Tuition",
        description: `Updated fees for grade level "${gradeLevel?.grade_level_name || "the selected grade level"}".`,
      },
      trx,
    );
  });
};

export const deleteGradeLevelFees = async (grade_level_id, user_id) => {
  return await db.transaction().execute(async (trx) => {
    const selectActiveSY = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!selectActiveSY) {
      throw new Error("No active school year found");
    }
    const activeSY_id = selectActiveSY.school_year_id;

    const existing = await trx
      .selectFrom("gradelevel_paymentoptions")
      .select("fees_id")
      .where("grade_level_id", "=", grade_level_id)
      .where("school_year_id", "=", activeSY_id)
      .executeTakeFirst();

    if (!existing) {
      throw new Error(
        "No fee setup found for this grade level and school year",
      );
    }

    await trx
      .deleteFrom("gradelevel_paymentoptions")
      .where("grade_level_id", "=", grade_level_id)
      .where("school_year_id", "=", activeSY_id)
      .execute();

    await trx
      .deleteFrom("fees")
      .where("fees_id", "=", existing.fees_id)
      .execute();

    const gradeLevel = await trx
      .selectFrom("grade_levels")
      .select("grade_level_name")
      .where("grade_level_id", "=", grade_level_id)
      .executeTakeFirst();

    await logAdminActivity(
      {
        user_id,
        user_action: "Deleted",
        user_module: "Tuition",
        description: `Deleted fees for grade level "${gradeLevel?.grade_level_name || "the selected grade level"}".`,
      },
      trx,
    );

    return {
      grade_level_id: Number(grade_level_id),
      school_year_id: activeSY_id,
      fees_id: existing.fees_id,
    };
  });
};

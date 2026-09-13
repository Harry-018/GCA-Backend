import db from "../config/db.js";

// payment option
export const getPaymentOptions = async () => {
  return await db.selectFrom("payment_option").selectAll().execute();
};

export const createPaymentOption = async (data) => {
  const result = await db
    .insertInto("payment_option")
    .values({
      option_name: data.option_name,
      due_date_display: data.due_date_display,
    })
    .executeTakeFirst();

  return { payment_option_id: Number(result.insertId) };
};

export const editPaymentOption = async (payment_option_id, data) => {
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

  return { payment_option_id: Number(payment_option_id) };
};

export const deletePaymentOption = async (payment_option_id) => {
  const result = await db
    .deleteFrom("payment_option")

    .where("payment_option_id", "=", payment_option_id)
    .executeTakeFirst();

  if (Number(result.numDeletedRows) === 0) {
    throw new Error("Payment option not found");
  }

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
  const activeSY = await db
    .selectFrom("school_years")
    .select("school_year_id")
    .where("sy_status", "=", "active")
    .executeTakeFirst();

  if (!activeSY) {
    throw new Error("No active school year found");
  }

  return await db
    .selectFrom("gradelevel_paymentoptions")
    .innerJoin(
      "payment_option",
      "payment_option.payment_option_id",
      "gradelevel_paymentoptions.payment_option_id",
    )
    .select([
      "gradelevel_paymentoptions.gradelevel_paymentoption_id",
      "payment_option.option_name",
      "payment_option.due_date_display",
      "gradelevel_paymentoptions.amount",
      "gradelevel_paymentoptions.discount",
    ])
    .where("gradelevel_paymentoptions.grade_level_id", "=", grade_level_id)
    .where(
      "gradelevel_paymentoptions.school_year_id",
      "=",
      activeSY.school_year_id,
    )
    .execute();
};

export const addFeesPaymentInGradeLevel = async (data) => {
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

    return {
      fees_id: fee_id,
      grade_level_id: data.grade_level_id,
      count: rows.length,
    };
  });
};

export const editGradeLevelFees = async (grade_level_id, data) => {
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
  });
};

export const deleteGradeLevelFees = async (grade_level_id) => {
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

    return {
      grade_level_id: Number(grade_level_id),
      school_year_id: activeSY_id,
      fees_id: existing.fees_id,
    };
  });
};

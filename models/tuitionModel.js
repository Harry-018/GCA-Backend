import db from "../config/db.js";

export const getTuitionGradeLevels = async () => {
  return await db
    .selectFrom("gradelevel_paymentoptions")
    .innerJoin(
      "grade_levels",
      "gradelevel_paymentoptions.grade_level_id",
      "grade_levels.grade_level_id",
    )
    .select(["grade_levels.grade_level_id", "grade_levels.grade_level_name"])
    .distinct()
    .orderBy("grade_levels.grade_level_id", "asc")
    .execute();
};

export const getTuition = async (grade_level_id) => {
  return await db
    .selectFrom("gradelevel_paymentoptions")
    .innerJoin(
      "grade_levels",
      "gradelevel_paymentoptions.grade_level_id",
      "grade_levels.grade_level_id",
    )
    .innerJoin(
      "payment_option",
      "gradelevel_paymentoptions.payment_option_id",
      "payment_option.payment_option_id",
    )
    .innerJoin("fees", "gradelevel_paymentoptions.fees_id", "fees.fees_id")
    .select([
      "grade_levels.grade_level_id",
      "grade_levels.grade_level_name",

      "fees.fees_id",
      "fees.tuition_fee",
      "fees.books",
      "fees.uniform_boys",
      "fees.uniform_girls",
      "fees.pe_uniform_boys",
      "fees.pe_uniform_girls",

      "payment_option.payment_option_id",
      "payment_option.option_name",
      "payment_option.installment",
      "payment_option.due_date_display",

      "gradelevel_paymentoptions.gradelevel_paymentoption_id",
      "gradelevel_paymentoptions.discount",
      "gradelevel_paymentoptions.amount",
    ])
    .where("gradelevel_paymentoptions.grade_level_id", "=", grade_level_id)
    .execute();
};

export const getGradeLevel = async () => {
  return await db
    .selectFrom("grade_levels")
    .select(["grade_level_id", "grade_level_name"])
    .orderBy("grade_level_id", "asc")
    .execute();
};

export const createGrade = async (data) => {
  return await db.transaction().execute(async (trx) => {
    // ------------------------------------------------------------
    // 1. Check if grade level is already configured
    // ------------------------------------------------------------
    const existing = await trx
      .selectFrom("gradelevel_paymentoptions")
      .select("gradelevel_paymentoption_id")
      .where("grade_level_id", "=", Number(data.grade_level_id))
      .executeTakeFirst();

    if (existing) {
      throw new Error("This grade level already has tuition configured.");
    }

    // ------------------------------------------------------------
    // 2. Create fees record
    // ------------------------------------------------------------
    const feeResult = await trx
      .insertInto("fees")
      .values({
        tuition_fee: Number(data.tuition_fee || 0),
        books: Number(data.books || 0),
        uniform_boys: Number(data.uniform_boys || 0),
        uniform_girls: Number(data.uniform_girls || 0),
        pe_uniform_boys: Number(data.pe_uniform_boys || 0),
        pe_uniform_girls: Number(data.pe_uniform_girls || 0),
      })
      .executeTakeFirst();

    const fees_id = Number(feeResult.insertId);

    // ------------------------------------------------------------
    // 3. Get ALL existing payment options
    // ------------------------------------------------------------
    const paymentOptions = await trx
      .selectFrom("payment_option")
      .select("payment_option_id")
      .execute();

    // ------------------------------------------------------------
    // 4. Apply ALL payment options to this grade level
    // ------------------------------------------------------------
    if (paymentOptions.length > 0) {
      const tuitionFee = Number(data.tuition_fee || 0);

      const paymentOptionRows = paymentOptions.map((option) => ({
        grade_level_id: Number(data.grade_level_id),
        payment_option_id: option.payment_option_id,
        discount: 0,
        amount: tuitionFee,
        fees_id,
      }));

      await trx
        .insertInto("gradelevel_paymentoptions")
        .values(paymentOptionRows)
        .execute();
    }

    return {
      fees_id,
      message: "Tuition created successfully.",
    };
  });
};

export const createPaymentOption = async (data) => {
  return await db.transaction().execute(async (trx) => {
    // ------------------------------------------------------------
    // 1. Create master payment option
    // ------------------------------------------------------------
    const paymentResult = await trx
      .insertInto("payment_option")
      .values({
        option_name: data.option_name,
        installment: data.installment,
        due_date_display: data.due_date_display,
      })
      .executeTakeFirst();

    const payment_option_id = Number(paymentResult.insertId);

    // ------------------------------------------------------------
    // 2. Get ALL configured tuition grade levels
    // ------------------------------------------------------------
    const configuredGrades = await trx
      .selectFrom("gradelevel_paymentoptions")
      .select(["grade_level_id", "fees_id"])
      .distinct()
      .execute();

    // ------------------------------------------------------------
    // 3. Apply new payment option to ALL configured grades
    // ------------------------------------------------------------
    if (configuredGrades.length > 0) {
      const paymentOptionRows = [];

      for (const grade of configuredGrades) {
        const fee = await trx
          .selectFrom("fees")
          .select("tuition_fee")
          .where("fees_id", "=", grade.fees_id)
          .executeTakeFirst();

        const tuitionFee = Number(fee?.tuition_fee || 0);

        paymentOptionRows.push({
          grade_level_id: grade.grade_level_id,
          payment_option_id,
          discount: 0,
          amount: tuitionFee,
          fees_id: grade.fees_id,
        });
      }

      await trx
        .insertInto("gradelevel_paymentoptions")
        .values(paymentOptionRows)
        .execute();
    }

    return {
      payment_option_id,
      message: "Payment option created successfully.",
    };
  });
};

export const patchFees = async (fees_id, data) => {
  return await db.transaction().execute(async (trx) => {
    // ------------------------------------------------------------
    // 1. Update fees
    // ------------------------------------------------------------
    const tuitionFee = Number(data.tuition_fee || 0);

    await trx
      .updateTable("fees")
      .set({
        tuition_fee: tuitionFee,
        books: Number(data.books || 0),
        uniform_boys: Number(data.uniform_boys || 0),
        uniform_girls: Number(data.uniform_girls || 0),
        pe_uniform_boys: Number(data.pe_uniform_boys || 0),
        pe_uniform_girls: Number(data.pe_uniform_girls || 0),
      })
      .where("fees_id", "=", fees_id)
      .executeTakeFirst();

    // ------------------------------------------------------------
    // 2. Get all payment configurations using these fees
    // ------------------------------------------------------------
    const paymentOptions = await trx
      .selectFrom("gradelevel_paymentoptions")
      .select(["gradelevel_paymentoption_id", "discount"])
      .where("fees_id", "=", fees_id)
      .execute();

    // ------------------------------------------------------------
    // 3. Recalculate final amount
    // ------------------------------------------------------------
    for (const option of paymentOptions) {
      const discount = Number(option.discount || 0);

      if (discount > tuitionFee) {
        throw new Error(
          "Existing discount cannot be greater than the new tuition fee.",
        );
      }

      const amount = tuitionFee - discount;

      await trx
        .updateTable("gradelevel_paymentoptions")
        .set({
          amount,
        })
        .where(
          "gradelevel_paymentoption_id",
          "=",
          option.gradelevel_paymentoption_id,
        )
        .executeTakeFirst();
    }

    return {
      message: "Fees updated successfully.",
    };
  });
};

export const patchPaymentOption = async (payment_option_id, data) => {
  return await db
    .updateTable("payment_option")
    .set({
      installment: data.installment,
    })
    .where("payment_option_id", "=", payment_option_id)
    .executeTakeFirst();
};

export const patchGradePaymentOption = async (
  gradelevel_paymentoption_id,
  data,
) => {
  return await db.transaction().execute(async (trx) => {
    // ------------------------------------------------------------
    // 1. Get tuition fee
    // ------------------------------------------------------------
    const record = await trx
      .selectFrom("gradelevel_paymentoptions")
      .innerJoin("fees", "gradelevel_paymentoptions.fees_id", "fees.fees_id")
      .select(["fees.tuition_fee"])
      .where(
        "gradelevel_paymentoptions.gradelevel_paymentoption_id",
        "=",
        gradelevel_paymentoption_id,
      )
      .executeTakeFirst();

    if (!record) {
      throw new Error("Grade payment option not found.");
    }

    // ------------------------------------------------------------
    // 2. Calculate final amount
    // ------------------------------------------------------------
    const discount = Number(data.discount || 0);
    const tuitionFee = Number(record.tuition_fee || 0);

    if (discount > tuitionFee) {
      throw new Error("Discount cannot be greater than the tuition fee.");
    }

    const amount = tuitionFee - discount;

    // ------------------------------------------------------------
    // 3. Update discount + final amount
    // ------------------------------------------------------------
    return await trx
      .updateTable("gradelevel_paymentoptions")
      .set({
        discount,
        amount,
      })
      .where("gradelevel_paymentoption_id", "=", gradelevel_paymentoption_id)
      .executeTakeFirst();
  });
};

export const deleteGrade = async (grade_level_id) => {
  return await db.transaction().execute(async (trx) => {
    // ------------------------------------------------------------
    // 1. Find fees associated with this tuition grade
    // ------------------------------------------------------------
    const records = await trx
      .selectFrom("gradelevel_paymentoptions")
      .select("fees_id")
      .distinct()
      .where("grade_level_id", "=", Number(grade_level_id))
      .execute();

    if (records.length === 0) {
      throw new Error("Tuition configuration not found.");
    }

    const feesIds = records.map((record) => record.fees_id);

    // ------------------------------------------------------------
    // 2. Delete grade/payment configurations
    // ------------------------------------------------------------
    await trx
      .deleteFrom("gradelevel_paymentoptions")
      .where("grade_level_id", "=", Number(grade_level_id))
      .execute();

    // ------------------------------------------------------------
    // 3. Delete associated fees
    // ------------------------------------------------------------
    for (const fees_id of feesIds) {
      await trx.deleteFrom("fees").where("fees_id", "=", fees_id).execute();
    }

    // ------------------------------------------------------------
    // IMPORTANT:
    // Do NOT delete:
    //
    // - grade_levels
    // - payment_option
    // ------------------------------------------------------------

    return {
      message: "Tuition configuration deleted successfully.",
    };
  });
};

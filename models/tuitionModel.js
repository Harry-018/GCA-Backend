import db from "../config/db.js";

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
      "gradelevel_paymentoptions.school_year_id",
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
    // Get the currently active school year
    const activeSchoolYear = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();

    if (!activeSchoolYear) {
      throw new Error("No active school year found.");
    }

    const school_year_id = activeSchoolYear.school_year_id;

    // Create the fee record
    const feeResult = await trx
      .insertInto("fees")
      .values({
        tuition_fee: data.tuition_fee,
        books: data.books,
        uniform_boys: data.uniform_boys,
        uniform_girls: data.uniform_girls,
        pe_uniform_boys: data.pe_uniform_boys,
        pe_uniform_girls: data.pe_uniform_girls,
      })
      .executeTakeFirst();

    const fees_id = Number(feeResult.insertId);

    // Create payment option records
    if (data.payment_options?.length > 0) {
      const paymentOptionRows = data.payment_options.map((option) => {
        const discount = Number(option.discount || 0);
        const amount = Number(data.tuition_fee) - discount;

        return {
          grade_level_id: data.grade_level_id,
          payment_option_id: option.payment_option_id,
          discount,
          amount,
          fees_id,
          school_year_id,
        };
      });

      await trx
        .insertInto("gradelevel_paymentoptions")
        .values(paymentOptionRows)
        .execute();
    }

    return {
      fees_id,
      school_year_id,
      message: "Tuition created successfully",
    };
  });
};

export const createPaymentOption = async (data) => {
  await db
    .insertInto("payment_option")
    .values({
      option_name: data.option_name,
      installment: data.installment,
      due_date_display: data.due_date_display,
    })
    .executeTakeFirst();
};

export const patchFees = async (fees_id, data) => {
  await db
    .updateTable("fees")
    .set({
      tuition_fee: data.tuition_fee,
      books: data.books,
      uniform_boys: data.uniform_boys,
      uniform_girls: data.uniform_girls,
      pe_uniform_boys: data.pe_uniform_boys,
      pe_uniform_girls: data.pe_uniform_girls,
    })
    .where("fees_id", "=", fees_id)
    .executeTakeFirst();
};

export const patchPaymentOption = async (payment_option_id, data) => {
  await db
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
  await db.transaction().execute(async (trx) => {
    const record = await trx
      .selectFrom("gradelevel_paymentoptions")
      .innerJoin("fees", "gradelevel_paymentoptions.fees_id", "fees.fees_id")
      .select("fees.tuition_fee")
      .where(
        "gradelevel_paymentoptions.gradelevel_paymentoption_id",
        "=",
        gradelevel_paymentoption_id,
      )
      .executeTakeFirst();

    if (!record) {
      throw new Error("Grade payment option not found.");
    }

    const discount = Number(data.discount || 0);
    const amount = Number(record.tuition_fee) - discount;

    return await trx
      .updateTable("gradelevel_paymentoptions")
      .set({
        discount,
        amount,
      })
      .where(
        "gradelevel_paymentoptions.gradelevel_paymentoption_id",
        "=",
        gradelevel_paymentoption_id,
      )
      .executeTakeFirst();
  });
};

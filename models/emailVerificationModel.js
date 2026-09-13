import db from "../config/db.js";

export const createVerification = async (data) => {
  const result = await db
    .insertInto("email_verification")
    .values({
      email: data.email,
      otp_code: data.otpHash,
      purpose: data.purpose,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      verified_at: null,
    })
    .executeTakeFirst();

  return Number(result.insertId);
};

export const getVerification = async (verification_id) => {
  return await db
    .selectFrom("email_verification")
    .selectAll()
    .where("verification_id", "=", verification_id)
    .executeTakeFirst();
};

export const verifyEmail = async (verification_id) => {
  await db
    .updateTable("email_verification")
    .set({
      verified_at: new Date(),
    })
    .where("verification_id", "=", verification_id)
    .execute();

  return true;
};

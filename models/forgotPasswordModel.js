import db from "../config/db.js";

// FIND ACCOUNT BY EMAIL
export const getUserAccountByEmail = async (email) => {
  return await db
    .selectFrom("user_accounts")
    .select(["user_id", "email", "account_status"])
    .where("email", "=", email)
    .executeTakeFirst();
};

// CREATE PASSWORD RESET VERIFICATION
export const createPasswordResetVerification = async ({ email, otpHash }) => {
  const result = await db
    .insertInto("email_verification")
    .values({
      email,
      otp_code: otpHash,
      purpose: "password_reset",
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      verified_at: null,
    })
    .executeTakeFirst();

  return Number(result.insertId);
};

// GET PASSWORD RESET VERIFICATION
export const getPasswordResetVerification = async (verification_id) => {
  return await db
    .selectFrom("email_verification")
    .selectAll()
    .where("verification_id", "=", Number(verification_id))
    .where("purpose", "=", "password_reset")
    .executeTakeFirst();
};

// VERIFY OTP AND SAVE RESET TOKEN HASH
export const markPasswordResetVerified = async (
  verification_id,
  resetTokenHash,
) => {
  const result = await db
    .updateTable("email_verification")
    .set({
      otp_code: resetTokenHash,
      verified_at: new Date(),
    })
    .where("verification_id", "=", Number(verification_id))
    .where("purpose", "=", "password_reset")
    .where("verified_at", "is", null)
    .executeTakeFirst();

  return Number(result.numUpdatedRows) > 0;
};

// RESET PASSWORD AND CONSUME VERIFICATION
export const resetUserPassword = async ({
  verification_id,
  resetTokenHash,
  passwordHash,
}) => {
  return await db.transaction().execute(async (trx) => {
    const verification = await trx
      .selectFrom("email_verification")
      .selectAll()
      .where("verification_id", "=", Number(verification_id))
      .where("purpose", "=", "password_reset")
      .forUpdate()
      .executeTakeFirst();

    if (!verification || !verification.verified_at) {
      throw new Error("Invalid password reset request.");
    }

    if (new Date() > new Date(verification.expires_at)) {
      throw new Error("Password reset request has expired.");
    }

    if (verification.otp_code !== resetTokenHash) {
      throw new Error("Invalid password reset token.");
    }

    const account = await trx
      .selectFrom("user_accounts")
      .select("user_id")
      .where("email", "=", verification.email)
      .executeTakeFirst();

    if (!account) {
      throw new Error("User account not found.");
    }

    await trx
      .updateTable("user_accounts")
      .set({
        password: passwordHash,
      })
      .where("user_id", "=", account.user_id)
      .execute();

    // Prevent reuse of the verification record
    await trx
      .updateTable("email_verification")
      .set({
        purpose: "password_reset_completed",
      })
      .where("verification_id", "=", Number(verification_id))
      .execute();

    return true;
  });
};

import crypto from "crypto";
import db from "../config/db.js";

export const createRegistrationInvitation = async (email) => {
  const token = crypto.randomBytes(32).toString("hex");

  const token_hash = crypto.createHash("sha256").update(token).digest("hex");

  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const result = await db
    .insertInto("teacher_registration_invitations")
    .values({
      token_hash,
      email,
      expires_at,
      created_at: new Date(),
    })
    .executeTakeFirst();

  return {
    registration_id: Number(result.insertId),
    token,
    email,
    expires_at,
  };
};

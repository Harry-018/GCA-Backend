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

export const getRegistrationInvitation = async (token) => {
  const token_hash = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await db
    .selectFrom("teacher_registration_invitations")
    .select(["registration_id", "email", "expires_at", "used_at"])
    .where("token_hash", "=", token_hash)
    .executeTakeFirst();

  if (!invitation) {
    return null;
  }

  if (invitation.used_at) {
    return {
      valid: false,
      reason: "used",
    };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return {
      valid: false,
      reason: "expired",
    };
  }

  return {
    valid: true,
    registration_id: invitation.registration_id,
    email: invitation.email,
  };
};

import crypto from "crypto";
import bcrypt from "bcrypt";
import db from "../config/db.js";

export const createAccountInvitation = async (user_id) => {
  const token = crypto.randomBytes(32).toString("hex");

  const token_hash = crypto.createHash("sha256").update(token).digest("hex");

  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return await db.transaction().execute(async (trx) => {
    // Check the account
    const user = await trx
      .selectFrom("user_accounts")
      .select(["user_id", "email", "role", "account_status"])
      .where("user_id", "=", user_id)
      .executeTakeFirst();

    if (!user) {
      throw new Error("User account not found.");
    }

    if (user.account_status !== "pending") {
      throw new Error("This account is not pending activation.");
    }

    // Remove an existing unused invitation
    await trx
      .deleteFrom("account_invitations")
      .where("user_id", "=", user_id)
      .where("used_at", "is", null)
      .execute();

    // Create new invitation
    const result = await trx
      .insertInto("account_invitations")
      .values({
        user_id,
        token_hash,
        expires_at,
        created_at: new Date(),
      })
      .executeTakeFirst();

    return {
      invitation_id: Number(result.insertId),
      user_id,
      email: user.email,
      token,
      expires_at,
    };
  });
};

export const getAccountInvitation = async (token) => {
  const token_hash = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await db
    .selectFrom("account_invitations as ai")
    .innerJoin("user_accounts as ua", "ua.user_id", "ai.user_id")
    .select([
      "ai.invitation_id",
      "ai.user_id",
      "ai.expires_at",
      "ai.used_at",
      "ua.email",
      "ua.role",
      "ua.account_status",
    ])
    .where("ai.token_hash", "=", token_hash)
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

  if (invitation.account_status !== "pending") {
    return {
      valid: false,
      reason: "account_not_pending",
    };
  }

  return {
    valid: true,
    invitation_id: invitation.invitation_id,
    user_id: invitation.user_id,
    email: invitation.email,
    role: invitation.role,
  };
};

export const activateAccount = async (data) => {
  const { activation_token, password } = data;

  return await db.transaction().execute(async (trx) => {
    // 1. Hash the token supplied by the teacher
    const token_hash = crypto
      .createHash("sha256")
      .update(activation_token)
      .digest("hex");

    // 2. Find the invitation
    const invitation = await trx
      .selectFrom("account_invitations")
      .select(["invitation_id", "user_id", "expires_at", "used_at"])
      .where("token_hash", "=", token_hash)
      .executeTakeFirst();

    if (!invitation) {
      throw new Error("Invalid account activation invitation.");
    }

    // 3. Check if already used
    if (invitation.used_at) {
      throw new Error(
        "This account activation invitation has already been used.",
      );
    }

    // 4. Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error("This account activation invitation has expired.");
    }

    // 5. Get account
    const user = await trx
      .selectFrom("user_accounts")
      .select(["user_id", "account_status"])
      .where("user_id", "=", invitation.user_id)
      .executeTakeFirst();

    if (!user) {
      throw new Error("User account not found.");
    }

    if (user.account_status !== "pending") {
      throw new Error("This account is not pending activation.");
    }

    // 6. Hash the password
    const password_hash = await bcrypt.hash(password, 12);

    // 7. Update account
    await trx
      .updateTable("user_accounts")
      .set({
        password: password_hash,
        account_status: "active",
      })
      .where("user_id", "=", invitation.user_id)
      .executeTakeFirst();

    // 8. Mark invitation as used
    await trx
      .updateTable("account_invitations")
      .set({
        used_at: new Date(),
      })
      .where("invitation_id", "=", invitation.invitation_id)
      .executeTakeFirst();

    return {
      user_id: invitation.user_id,
    };
  });
};

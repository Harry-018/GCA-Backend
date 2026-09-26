import crypto from "crypto";
import db from "../config/db.js";
import { teacherNo } from "../functions/NumberGenerator.js";

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

export const submitTeacherRegistration = async (data) => {
  return await db.transaction().execute(async (trx) => {
    // 1. Verify registration invitation
    const token_hash = crypto
      .createHash("sha256")
      .update(data.registration_token)
      .digest("hex");

    const invitation = await trx
      .selectFrom("teacher_registration_invitations")
      .select(["registration_id", "email", "expires_at", "used_at"])
      .where("token_hash", "=", token_hash)
      .executeTakeFirst();

    if (!invitation) {
      throw new Error("Invalid registration invitation.");
    }

    if (invitation.used_at) {
      throw new Error("This registration invitation has already been used.");
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error("This registration invitation has expired.");
    }

    // 2. Create teacher address
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

    // 3. Create pending user account
    const accountResult = await trx
      .insertInto("user_accounts")
      .values({
        email: invitation.email,
        password: null,
        first_name: data.first_name,
        last_name: data.last_name,
        role: "teacher",
        account_status: "pending",
        created_at: new Date(),
      })
      .executeTakeFirst();

    const user_id = Number(accountResult.insertId);

    // 4. Create teacher information
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

    // 5. Create teacher record
    const teacherResult = await trx
      .insertInto("teachers")
      .values({
        teacher_info_id,
        teacher_num: await teacherNo(trx),
        teacher_status: "active",
      })
      .executeTakeFirst();

    const teacher_id = Number(teacherResult.insertId);

    // 6. Mark registration invitation as used
    await trx
      .updateTable("teacher_registration_invitations")
      .set({
        used_at: new Date(),
      })
      .where("registration_id", "=", invitation.registration_id)
      .executeTakeFirst();

    return {
      teacher_id,
      teacher_info_id,
      user_id,
      address_id,
    };
  });
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

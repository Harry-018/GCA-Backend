import crypto from "crypto";
import db from "../config/db.js";

export const getUserAccounts = async ({
  status = "all",
  role = "all",
  search = "",
  page = 1,
  limit = 10,
}) => {
  const offset = (page - 1) * limit;
  const searchTerm = search.trim();

  let query = db
    .selectFrom("user_accounts as ua")
    .select([
      "ua.user_id",
      "ua.email",
      "ua.first_name",
      "ua.last_name",
      "ua.role",
      "ua.account_status",
      "ua.created_at",
    ]);

  if (status !== "all") {
    query = query.where("ua.account_status", "=", status);
  }

  if (role !== "all") {
    query = query.where("ua.role", "=", role);
  }

  if (searchTerm) {
    query = query.where((eb) =>
      eb.or([
        eb("ua.email", "like", `%${searchTerm}%`),
        eb("ua.first_name", "like", `%${searchTerm}%`),
        eb("ua.last_name", "like", `%${searchTerm}%`),
        eb("ua.role", "like", `%${searchTerm}%`),
        eb("ua.account_status", "like", `%${searchTerm}%`),
      ]),
    );
  }

  const [data, countResult] = await Promise.all([
    query
      .orderBy("ua.created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute(),

    getUserAccountCount({
      status,
      role,
      search: searchTerm,
    }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total: countResult,
      totalPages: Math.ceil(countResult / limit),
    },
  };
};

const getUserAccountCount = async ({
  status = "all",
  role = "all",
  search = "",
}) => {
  let query = db
    .selectFrom("user_accounts as ua")
    .select(({ fn }) => fn.count("ua.user_id").as("count"));

  if (status !== "all") {
    query = query.where("ua.account_status", "=", status);
  }

  if (role !== "all") {
    query = query.where("ua.role", "=", role);
  }

  if (search) {
    query = query.where((eb) =>
      eb.or([
        eb("ua.email", "like", `%${search}%`),
        eb("ua.first_name", "like", `%${search}%`),
        eb("ua.last_name", "like", `%${search}%`),
        eb("ua.role", "like", `%${search}%`),
        eb("ua.account_status", "like", `%${search}%`),
      ]),
    );
  }

  const result = await query.executeTakeFirst();

  return Number(result?.count ?? 0);
};

export const createAccountInvitation = async (user_id) => {
  const user = await db
    .selectFrom("user_accounts")
    .select([
      "user_id",
      "email",
      "first_name",
      "last_name",
      "role",
      "account_status",
    ])
    .where("user_id", "=", user_id)
    .executeTakeFirst();

  if (!user) {
    throw new Error("User account not found.");
  }

  if (user.role === "admin") {
    throw new Error("Admin accounts cannot be invited.");
  }

  if (user.account_status === "disabled") {
    throw new Error("Disabled accounts cannot be invited.");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.transaction().execute(async (trx) => {
    // Remove previous invitation.
    await trx
      .deleteFrom("account_invitations")
      .where("user_id", "=", user_id)
      .execute();

    // Create new invitation.
    await trx
      .insertInto("account_invitations")
      .values({
        user_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used_at: null,
        created_at: new Date(),
      })
      .execute();

    // Keep account pending until activation is completed.
    await trx
      .updateTable("user_accounts")
      .set({
        account_status: "pending",
      })
      .where("user_id", "=", user_id)
      .execute();
  });

  return {
    user,
    token: rawToken,
    expires_at: expiresAt,
  };
};

export const disableAccount = async (user_id) => {
  const user = await db
    .selectFrom("user_accounts")
    .select(["user_id", "role", "account_status"])
    .where("user_id", "=", user_id)
    .executeTakeFirst();

  if (!user) {
    throw new Error("User account not found.");
  }

  if (user.role === "admin") {
    throw new Error("Admin accounts cannot be disabled.");
  }

  if (user.account_status !== "active") {
    throw new Error("Only active accounts can be disabled.");
  }

  await db
    .updateTable("user_accounts")
    .set({
      account_status: "disabled",
    })
    .where("user_id", "=", user_id)
    .execute();

  return {
    user_id: Number(user_id),
    account_status: "disabled",
  };
};

export const reactivateAccount = async (user_id) => {
  const user = await db
    .selectFrom("user_accounts")
    .select(["user_id", "role", "account_status"])
    .where("user_id", "=", user_id)
    .executeTakeFirst();

  if (!user) {
    throw new Error("User account not found.");
  }

  if (user.role === "admin") {
    throw new Error("Admin accounts cannot be reactivated.");
  }

  if (user.account_status !== "disabled") {
    throw new Error("Only disabled accounts can be reactivated.");
  }

  await db
    .updateTable("user_accounts")
    .set({
      account_status: "active",
    })
    .where("user_id", "=", user_id)
    .execute();

  return {
    user_id: Number(user_id),
    account_status: "active",
  };
};

import db from "../config/db.js";

export const getAccount = async (email) => {
  return await db
    .selectFrom("user_accounts")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();
};

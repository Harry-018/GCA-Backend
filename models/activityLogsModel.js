import db from "../config/db.js";

export const logAdminActivity = async (data, executor = db) => {
  const { user_id, user_action, user_module, description } = data;

  return await executor
    .insertInto("activity_logs")
    .values({
      date_time: new Date(),
      user_id,
      user_action,
      user_module,
      description,
    })
    .executeTakeFirst();
};

export const getAdminActivityLogs = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const logs = await db
    .selectFrom("activity_logs as al")
    .innerJoin("user_accounts as ua", "ua.user_id", "al.user_id")
    .select([
      "al.log_id",
      "al.date_time as timestamp",
      "ua.first_name",
      "ua.last_name",
      "ua.role",
      "al.user_action as action",
      "al.user_module as module",
      "al.description",
    ])
    .orderBy("al.date_time", "desc")
    .orderBy("al.log_id", "desc")
    .limit(limit)
    .offset(offset)
    .execute();

  const count = await db
    .selectFrom("activity_logs")
    .select((eb) => eb.fn.countAll().as("total"))
    .executeTakeFirst();

  return {
    logs,
    total: Number(count?.total || 0),
  };
};

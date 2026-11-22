import db from "../config/db.js";
import { sql } from "kysely";
import { logAdminActivity } from "./activityLogsModel.js";

export const getInquiries = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const inquiries = await db
    .selectFrom("inquiries as i")
    .leftJoin("user_accounts as ua", "ua.user_id", "i.user_id")
    .select([
      "i.inquire_id",
      "i.name",
      "i.email",
      "i.question",
      "i.answer",
      "i.is_read",
      "i.user_id",
      "i.date_submitted",
      sql`CONCAT(ua.first_name, ' ', ua.last_name)`.as("admin_name"),
    ])
    .orderBy(
      sql`CASE
        WHEN i.answer IS NULL OR TRIM(i.answer) = '' THEN 0
        ELSE 1
      END`,
      "asc",
    )
    .orderBy("i.date_submitted", "asc")
    .orderBy("i.inquire_id", "asc")
    .limit(limit + 1)
    .offset(offset)
    .execute();

  const hasMore = inquiries.length > limit;

  return {
    inquiries: inquiries.slice(0, limit),
    hasMore,
    nextPage: hasMore ? page + 1 : null,
  };
};

export const createInquiry = async (data) => {
  const result = await db
    .insertInto("inquiries")
    .values({
      name: data.name,
      email: data.email,
      question: data.question,
    })
    .executeTakeFirst();

  return {
    inquire_id: Number(result.insertId),
    ...data,
  };
};

// Admin: Reply to inquiry
export const replyToInquiry = async (inquire_id, answer, user_id) => {
  const inquiry = await db
    .selectFrom("inquiries")
    .select(["inquire_id", "name", "email", "question"])
    .where("inquire_id", "=", inquire_id)
    .executeTakeFirst();

  if (!inquiry) {
    return null;
  }

  await db
    .updateTable("inquiries")
    .set({
      answer,
      user_id,
    })
    .where("inquire_id", "=", inquire_id)
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Inquiries",
    description: `Replied to inquiry from ${inquiry.email}.`,
  });

  return {
    ...inquiry,
    answer,
    user_id,
  };
};

export const markInquiryAsRead = async (inquire_id, user_id) => {
  const inquiry = await db
    .selectFrom("inquiries")
    .select("email")
    .where("inquire_id", "=", inquire_id)
    .executeTakeFirst();

  const result = await db
    .updateTable("inquiries")
    .set({
      is_read: true,
    })
    .where("inquire_id", "=", inquire_id)
    .executeTakeFirst();

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Inquiries",
    description: `Marked inquiry from ${inquiry?.email ?? "unknown sender"} as read.`,
  });

  return result;
};

import db from "../config/db.js";

const generateUniqueNumber = async (prefix, table, column, dbInstance = db) => {
  while (true) {
    const number = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const existing = await dbInstance
      .selectFrom(table)
      .select(column)
      .where(column, "=", number)
      .executeTakeFirst();

    if (!existing) {
      return number;
    }
  }
};

export const applicationNo = async (dbInstance = db) => {
  return generateUniqueNumber(
    "APP",
    "applications",
    "application_no",
    dbInstance,
  );
};

export const studentNo = async (dbInstance = db) => {
  return generateUniqueNumber("STU", "students", "stu_num", dbInstance);
};

export const teacherNo = async (dbInstance = db) => {
  return generateUniqueNumber("TCH", "teachers", "teacher_num", dbInstance);
};

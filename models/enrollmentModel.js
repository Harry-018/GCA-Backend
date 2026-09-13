import db from "../config/db.js";

export const addStudentToSection = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const addStudent = await trx.insertInto("enrollment").values({
      section_id: data.section_id,
      stu_id: data.stu_id,
    });
  });
};

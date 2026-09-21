import { sql } from "kysely";
import db from "../config/db.js";
import * as ng from "../functions/NumberGenerator.js";
import { getVerification } from "./emailVerificationModel.js";

const formatDateOnly = (date) => {
  if (!date) return null;

  if (typeof date === "string") {
    return date.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

export const applyApplication = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const verification = await getVerification(data.verification_id);
    if (!verification) {
      throw new Error("Email verification not found.");
    }
    if (!verification.verified_at) {
      throw new Error("Email has not been verified.");
    }
    const checkDuplicate = await trx
      .selectFrom("applicant_info")
      .select(["applicant_info_id"])
      .where("first_name", "=", data.s_first_name)
      .where("last_name", "=", data.s_last_name)
      .where("middle_name", "=", data.s_mid_name)
      .where("bdate", "=", data.s_bdate)
      .executeTakeFirst();
    if (checkDuplicate) {
      throw new Error("Applicant already exists.");
    }
    const address = await trx
      .insertInto("applicant_address")
      .values({
        province: data.province,
        city_municipality: data.city_municipality,
        barangay: data.barangay,
        house_no: data.house_no,
        zipcode: data.zipcode,
      })
      .executeTakeFirst();
    const address_id = Number(address.insertId);
    const info = await trx
      .insertInto("applicant_info")
      .values({
        first_name: data.s_first_name,
        last_name: data.s_last_name,
        middle_name: data.s_mid_name,
        gender: data.s_gender,
        bdate: data.s_bdate,
        birthplace: data.s_birthplace,
        religion: data.s_religion,
        nationality: data.s_nationality,
        disabled: data.s_disabled,
        disability: data.s_disability,
        address_id,
      })
      .executeTakeFirst();
    const info_id = Number(info.insertId);
    const appNo = ng.applicationNo();
    const activeSY = await trx
      .selectFrom("school_years")
      .select("school_year_id")
      .where("sy_status", "=", "active")
      .executeTakeFirst();
    if (!activeSY) {
      throw new Error("There is currently no active school year.");
    }
    const application = await trx
      .insertInto("applications")
      .values({
        application_no: appNo,
        grade_level_id: data.grade_level_id,
        school_year_id: activeSY.school_year_id,
        applicant_info_id: info_id,
        verification_id: data.verification_id,
        application_status: data.application_status,
        gradelevel_paymentoption_id: data.gradelevel_paymentoption_id,
        rejection_reason_id: data.rejection_reason_id,
      })
      .executeTakeFirst();
    const application_id = Number(application.insertId);

    const parents = data.parents.filter((parent, index) => {
      if (index < 2) return true;

      return parent.p_first_name || parent.p_last_name;
    });

    for (const parent of parents) {
      const parentInfo = await trx
        .insertInto("parent_info")
        .values({
          first_name: parent.p_first_name,
          last_name: parent.p_last_name,
          middle_name: parent.p_middle_name,
          contact_number: parent.p_contact_number,
          occupation: parent.p_occupation,
          email: parent.p_email,
        })
        .executeTakeFirst();
      const parent_id = Number(parentInfo.insertId);
      await trx
        .insertInto("applicant_parent")
        .values({
          application_id,
          parent_info_id: parent_id,
          relationship_type: parent.relationship_type,
          will_receive_account: parent.will_receive_account,
        })
        .executeTakeFirst();
    }
    return { application_id, application_no: appNo };
  });
};

export const getRecentApplications = async () => {
  return await db
    .selectFrom("applications as a")
    .innerJoin(
      "applicant_info as ai",
      "ai.applicant_info_id",
      "a.applicant_info_id",
    )
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "a.grade_level_id")
    .select([
      "a.application_id",
      "a.application_no",
      "a.application_status",
      "a.date_applied",

      "ai.first_name",
      "ai.last_name",
      "ai.gender",

      "gl.grade_level_name as grade_level",
    ])
    .where("a.application_status", "=", "pending")
    .orderBy("a.date_applied", "desc")
    .limit(10)
    .execute();
};

const buildApplicationsQuery = ({ app_status, search }) => {
  let qb = db
    .selectFrom("applications as a")
    .innerJoin(
      "applicant_info as ai",
      "ai.applicant_info_id",
      "a.applicant_info_id",
    )
    .innerJoin(
      "email_verification as ev",
      "ev.verification_id",
      "a.verification_id",
    )
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "a.grade_level_id");
  if (app_status) {
    qb = qb.where("a.application_status", "=", app_status);
  }
  if (search) {
    const term = `%${search}%`;
    qb = qb.where((eb) =>
      eb.or([
        eb("a.application_no", "like", term),
        eb("ai.first_name", "like", term),
        eb("ai.last_name", "like", term),
        eb(
          eb.fn("concat", ["ai.first_name", eb.val(" "), "ai.last_name"]),
          "like",
          term,
        ),
      ]),
    );
  }
  return qb;
};

export const getApplications = async (app_status, page, limit, search) => {
  const offset = (page - 1) * limit;
  const applications = await buildApplicationsQuery({ app_status, search })
    .select([
      "a.application_id",
      "a.application_no",
      "a.application_status",
      "a.date_applied",
      "a.rejected_at",
      "ev.email",
      "ai.first_name",
      "ai.last_name",
      "gl.grade_level_name as grade_level",
    ])
    .orderBy("a.date_applied", "asc")
    .limit(limit)
    .offset(offset)
    .execute();
  const countResult = await buildApplicationsQuery({ app_status, search })
    .select(({ fn }) => fn.countAll().as("total"))
    .executeTakeFirst();
  const total = Number(countResult?.total ?? 0);
  const totalPages = Math.ceil(total / limit);
  return { applications, total, totalPages };
};

export const getApplicationById = async (application_id) => {
  const application = await db
    .selectFrom("applications as a")
    .innerJoin(
      "applicant_info as ai",
      "ai.applicant_info_id",
      "a.applicant_info_id",
    )
    .innerJoin("applicant_address as aa", "aa.address_id", "ai.address_id")

    .innerJoin(
      "email_verification as ev",
      "ev.verification_id",
      "a.verification_id",
    )
    .innerJoin("grade_levels as gl", "gl.grade_level_id", "a.grade_level_id")
    .select([
      "a.application_id",
      "a.application_no",
      "a.application_status",
      "a.date_applied",
      "a.rejected_at",
      "a.rejection_reason_id",
      "a.gradelevel_paymentoption_id",
      "ev.email",
      "ai.applicant_info_id",
      "ai.first_name",
      "ai.middle_name",
      "ai.last_name",
      "ai.gender",
      "ai.bdate",
      sql`TIMESTAMPDIFF(YEAR, ai.bdate, CURDATE())`.as("age"),
      "ai.birthplace",
      "ai.religion",
      "ai.nationality",
      "ai.disabled",
      "ai.disability",
      "aa.province",
      "aa.city_municipality",
      "aa.barangay",
      "aa.house_no",
      "aa.zipcode",
      "gl.grade_level_name",
    ])
    .where("a.application_id", "=", application_id)
    .executeTakeFirst();
  if (!application) {
    throw new Error("Application not found.");
  }
  const parents = await db
    .selectFrom("applicant_parent as ap")
    .innerJoin("parent_info as pi", "pi.parent_info_id", "ap.parent_info_id")
    .select([
      "ap.app_parent_id",
      "ap.relationship_type",
      "ap.will_receive_account",
      "pi.parent_info_id",
      "pi.first_name",
      "pi.middle_name",
      "pi.last_name",
      "pi.contact_number",
      "pi.occupation",
      "pi.email",
    ])
    .where("ap.application_id", "=", application_id)
    .orderBy("ap.app_parent_id", "asc")
    .execute();
  const father = parents[0] || {};
  const mother = parents[1] || {};
  const guardian = parents[2] || {};
  return {
    application_id: application.application_id,
    application_no: application.application_no,
    email: application.email,
    status: application.application_status,
    dateApplied: application.date_applied,
    rejected_at: application.rejected_at,
    rejection_reason_id: application.rejection_reason_id,
    student: {
      gradeLevel: application.grade_level_name,
      firstName: application.first_name,
      middleName: application.middle_name,
      lastName: application.last_name,
      gender: application.gender,
      dateOfBirth: formatDateOnly(application.bdate),
      age: application.age,
      placeOfBirth: application.birthplace,
      religion: application.religion,
      nationality: application.nationality,
      disability: application.disabled ? application.disability : "None",
    },
    father: father
      ? {
          firstName: father.first_name,
          middleName: father.middle_name,
          lastName: father.last_name,
          occupation: father.occupation,
          contactNo: father.contact_number,
          email: father.email,
        }
      : {},
    mother: mother
      ? {
          firstName: mother.first_name,
          middleName: mother.middle_name,
          lastName: mother.last_name,
          occupation: mother.occupation,
          contactNo: mother.contact_number,
          email: mother.email,
        }
      : {},
    address: {
      street: application.house_no,
      barangay: application.barangay,
      city: application.city_municipality,
      province: application.province,
      zipCode: application.zipcode,
    },
    guardian: guardian
      ? {
          firstName: guardian.first_name,
          middleName: guardian.middle_name,
          lastName: guardian.last_name,
          occupation: guardian.occupation,
          contactNo: guardian.contact_number,
          email: guardian.email,
        }
      : {},
  };
};

export const approveApplicant = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const application = await trx
      .selectFrom("applications as a")
      .innerJoin(
        "applicant_info as ai",
        "ai.applicant_info_id",
        "a.applicant_info_id",
      )
      .select([
        "a.application_id",
        "a.application_no",
        "ai.first_name",
        "ai.last_name",
      ])
      .where("a.application_id", "=", data.application_id)
      .where("a.application_status", "=", "pending")
      .executeTakeFirst();

    if (!application) {
      throw new Error("Application does not exist or is not pending.");
    }

    await trx
      .updateTable("applications")
      .set({
        application_status: "approved",
      })
      .where("application_id", "=", data.application_id)
      .executeTakeFirst();

    const insertApproval = await trx
      .insertInto("app_approval")
      .values({
        application_id: data.application_id,
        purpose: "application",
        sub_date: data.sub_date,
        from_time: data.from_time,
        to_time: data.to_time,
        approval_status: "approved",
        approved_at: new Date(),
        rejected_at: null,
        rejection_reason_id: null,
      })
      .executeTakeFirst();

    return {
      application_id: application.application_id,
      application_no: application.application_no,
      applicant_name: `${application.first_name} ${application.last_name}`,
      sub_date: data.sub_date,
      from_time: data.from_time,
      to_time: data.to_time,
      approval_id: Number(insertApproval.insertId),
    };
  });
};

export const bulkApproveApplicants = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const applications = await trx
      .selectFrom("applications as a")
      .innerJoin(
        "applicant_info as ai",
        "ai.applicant_info_id",
        "a.applicant_info_id",
      )
      .select([
        "a.application_id",
        "a.application_no",
        "ai.first_name",
        "ai.last_name",
      ])
      .where("a.application_id", "in", data.application_ids)
      .where("a.application_status", "=", "pending")
      .execute();

    if (applications.length !== data.application_ids.length) {
      throw new Error(
        "Some applications do not exist or are no longer pending.",
      );
    }

    await trx
      .updateTable("applications")
      .set({
        application_status: "approved",
      })
      .where("application_id", "in", data.application_ids)
      .execute();

    const approvals = data.application_ids.map((application_id) => ({
      application_id,
      purpose: "application",
      sub_date: data.sub_date,
      from_time: data.from_time,
      to_time: data.to_time,
      approval_status: "approved",
      approved_at: new Date(),
      rejected_at: null,
      rejection_reason_id: null,
    }));

    await trx.insertInto("app_approval").values(approvals).execute();

    return {
      applications: applications.map((application) => ({
        application_id: application.application_id,
        application_no: application.application_no,
        applicant_name: `${application.first_name} ${application.last_name}`,
        sub_date: data.sub_date,
        from_time: data.from_time,
        to_time: data.to_time,
      })),
      approved_count: applications.length,
    };
  });
};

export const getRejectionReasons = async () => {
  return await db
    .selectFrom("rejection")
    .select(["rejection_reason_id", "rejection_reason"])
    .orderBy("rejection_reason_id", "asc")
    .execute();
};

export const rejectApplicant = async (data) => {
  const result = await db
    .updateTable("applications")
    .set({
      application_status: "rejected",
      rejection_reason_id: data.rejection_reason_id,
      rejected_at: new Date(),
    })
    .where("application_id", "=", data.application_id)
    .where("application_status", "=", "pending")
    .executeTakeFirst();
  if (Number(result.numUpdatedRows) !== 1) {
    throw new Error("Application does not exist or is not pending.");
  }
  return { application_id: data.application_id };
};

export const getApprovedApplicants = async (sub_date) => {
  return await db
    .selectFrom("app_approval as aa")
    .innerJoin("applications as a", "a.application_id", "aa.application_id")
    .select([
      "aa.approval_id",
      "aa.application_id",
      "aa.sub_date",
      "aa.from_time",
      "aa.to_time",
      "aa.approval_status",

      "a.application_no",
      "a.application_status",
    ])
    .where("aa.sub_date", "=", sub_date)
    .where("aa.approval_status", "=", "approved")
    .orderBy("aa.from_time", "asc")
    .execute();
};

export const enrollApplicant = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const approval = await trx
      .selectFrom("app_approval")
      .selectAll()
      .where("approval_id", "=", data.app_approval_id)
      .where("approval_status", "=", "approved")
      .executeTakeFirst();
    if (!approval) {
      throw new Error("Approved application not found.");
    }
    const existingSubmission = await trx
      .selectFrom("submissions")
      .select("submission_id")
      .where("app_approval_id", "=", data.app_approval_id)
      .executeTakeFirst();
    if (existingSubmission) {
      throw new Error("Applicant has already been submitted.");
    }
    const insertSubmission = await trx
      .insertInto("submissions")
      .values({
        app_approval_id: data.app_approval_id,
        sub_status: "confirmed",
        rejection_reason_id: null,
        received_at: new Date(),
        received_by: data.received_by,
      })
      .executeTakeFirst();
    const submission_id = Number(insertSubmission.insertId);
    const officialStudent = await trx
      .insertInto("students")
      .values({
        submission_id,
        stu_num: ng.studentNo(),
        lrn: null,
        stu_status: "active",
      })
      .executeTakeFirst();
    return { submission_id, student_id: Number(officialStudent.insertId) };
  });
};

import db from "../config/db.js";
import * as ng from "../functions/NumberGenerator.js";
import { getVerification } from "./emailVerificationModel.js";

export const applyApplication = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const verification = await getVerification(data.verification_id);

    if (!verification) {
      throw new Error("Email verification not found.");
    }

    if (!verification.verified_at) {
      throw new Error("Email has not been verified.");
    }

    //insert into applicant address
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

    //insert into applicant info
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
        address_id: address_id,
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

    //insert into parent info
    for (const parent of data.parents) {
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

    return {
      application_id,
      application_no: appNo,
    };
  });
};

export const getRecentApplications = async () => {
  return await db
    .selectFrom("applications")
    .selectAll()
    .orderBy("date_applied", "desc")
    .limit(10)
    .where("application_status", "=", "pending")
    .execute();
};

export const getApplications = async (app_status) => {
  let query = db.selectFrom("applications").selectAll();
  if (app_status) {
    query = query.where("application_status", "=", app_status);
  }

  return await query.execute();
};

export const getApplicationById = async (application_id) => {
  return await db
    .selectFrom("applications")
    .selectAll()
    .where("application_id", "=", application_id)
    .executeTakeFirst();
};

export const approveApplicant = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const updateApplicant = await trx
      .updateTable("applications")
      .set({ application_status: "approved" })
      .where("application_id", "=", data.application_id)
      .where("application_status", "=", "pending")
      .executeTakeFirst();

    if (Number(updateApplicant.numUpdatedRows) !== 1) {
      throw new Error("Application does not exist or is not pending.");
    }

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
        reject_at: null,
        rejection_reason_id: null,
      })
      .executeTakeFirst();

    return {
      application_id: data.application_id,
      approval_id: Number(insertApproval.insertId),
    };
  });
};

export const bulkApproveApplicants = async (data) => {
  return await db.transaction().execute(async (trx) => {
    const updateApplicant = await trx
      .updateTable("applications")
      .set({ application_status: "approved" })
      .where("application_id", "in", data.application_ids)
      .where("application_status", "=", "pending")
      .executeTakeFirst();

    if (
      Number(updateApplicant.numUpdatedRows) !== data.application_ids.length
    ) {
      throw new Error(
        "Some applications do not exist or are no longer pending.",
      );
    }

    const approvals = data.application_ids.map((application_id) => ({
      application_id,
      purpose: "application",
      sub_date: data.sub_date,
      from_time: data.from_time,
      to_time: data.to_time,
      approval_status: "approved",
      approved_at: new Date(),
      reject_at: null,
      rejection_reason_id: null,
    }));

    await trx.insertInto("app_approval").values(approvals).execute();

    return {
      application_ids: data.application_ids,
      approved_count: data.application_ids.length,
    };
  });
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

  return {
    application_id: data.application_id,
  };
};

export const getApprovedApplicants = async (data) => {
  return await db
    .selectFrom("app_approval")
    .selectAll()
    .where("sub_date", "=", data.sub_date)
    .where("approval_status", "=", "approved")
    .orderBy("from_time", "asc")
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
        received_by: selectAdmin.user_id,
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

    return {
      submission_id,
      student_id: Number(officialStudent.insertId),
    };
  });
};

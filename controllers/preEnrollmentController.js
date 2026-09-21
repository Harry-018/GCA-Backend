import { sendApplicationApproval } from "../emails/emailService.js";
import * as pe from "../models/preEnrollmentModel.js";

export const createApplication = async (req, res) => {
  try {
    const application = await pe.applyApplication(req.body);
    res
      .status(201)
      .json({ message: "Application Successful", data: application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getRecentApplications = async (req, res) => {
  try {
    const recentApplications = await pe.getRecentApplications();
    res.status(200).json({ data: recentApplications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getApplications = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await pe.getApplications(
      req.query.application_status,
      page,
      limit,
      req.query.search,
    );
    res.status(200).json({
      data: result.applications,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getApplicant = async (req, res) => {
  try {
    const applicant = await pe.getApplicationById(req.params.application_id);
    res.status(200).json({ data: applicant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const approveApplicant = async (req, res) => {
  try {
    const approved = await pe.approveApplicant({
      application_id: req.body.application_id,
      sub_date: req.body.sub_date,
      from_time: req.body.from_time,
      to_time: req.body.to_time,
    });

    await sendApplicationApproval({
      application_id: approved.application_id,
      application_no: approved.application_no,
      applicant_name: approved.applicant_name,
      sub_date: approved.sub_date,
      from_time: approved.from_time,
      to_time: approved.to_time,
    });

    res.status(200).json({
      message: "Applicant approved and confirmation email sent.",
      data: approved,
    });
  } catch (error) {
    console.error("Failed to approve applicant:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const bulkApproveApplicants = async (req, res) => {
  try {
    const approved = await pe.bulkApproveApplicants({
      application_ids: req.body.application_ids,
      sub_date: req.body.sub_date,
      from_time: req.body.from_time,
      to_time: req.body.to_time,
    });

    for (const applicant of approved.applications) {
      await sendApplicationApproval({
        application_id: applicant.application_id,
        application_no: applicant.application_no,
        applicant_name: applicant.applicant_name,
        sub_date: applicant.sub_date,
        from_time: applicant.from_time,
        to_time: applicant.to_time,
      });
    }

    // await Promise.all(
    //   approved.applications.map((applicant) =>
    //     sendApplicationApproval({
    //       application_id: applicant.application_id,
    //       application_no: applicant.application_no,
    //       applicant_name: applicant.applicant_name,
    //       sub_date: applicant.sub_date,
    //       from_time: applicant.from_time,
    //       to_time: applicant.to_time,
    //     }),
    //   ),
    // );

    res.status(200).json({
      message: "Applicants approved and confirmation emails sent.",
      data: approved,
    });
  } catch (error) {
    console.error("Failed to bulk approve applicants:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getRejectionReasons = async (req, res) => {
  try {
    const reasons = await pe.getRejectionReasons();

    res.status(200).json({
      data: reasons,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const rejectApplicant = async (req, res) => {
  try {
    const rejected = await pe.rejectApplicant({
      application_id: req.params.application_id,
      rejection_reason_id: req.body.rejection_reason_id,
    });
    res
      .status(200)
      .json({ message: "Applicant rejected successfully", data: rejected });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getApprovedApplicants = async (req, res) => {
  try {
    const { sub_date, search = "", page = 1, limit = 10 } = req.query;

    const approved = await pe.getApprovedApplicants(
      sub_date,
      search,
      Number(page),
      Number(limit),
    );

    res.status(200).json(approved);
  } catch (error) {
    console.error("getApprovedApplicants:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const enrollApplicant = async (req, res) => {
  try {
    const student = await pe.enrollApplicant({
      app_approval_id: req.params.app_approval_id,
      received_by: req.user.user_id,
    });
    res.status(201).json({ message: "Enrolling Successful", data: student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectApprovedApplicant = async (req, res) => {
  try {
    const result = await pe.rejectApprovedApplicant({
      app_approval_id: req.params.app_approval_id,
      rejection_reason_id: req.body.rejection_reason_id,
    });

    res.status(201).json({
      message: "Applicant rejected successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Reject approved applicant error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const rescheduleApprovedApplicant = async (req, res) => {
  try {
    const result = await pe.rescheduleApprovedApplicant({
      app_approval_id: req.params.app_approval_id,
      sub_date: req.body.sub_date,
      from_time: req.body.from_time,
      to_time: req.body.to_time,
    });

    res.status(200).json({
      message: "Applicant rescheduled successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Reschedule approved applicant error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

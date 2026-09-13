import * as pe from "../models/preEnrollmentModel.js";
import * as ev from "../models/emailVerificationModel.js";

export const createApplication = async (req, res) => {
  try {
    const application = await pe.applyApplication(req.body);

    res.status(201).json({
      message: "Application Successful",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
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
    const applications = await pe.getApplications(req.query.application_status);

    res.status(200).json({
      data: applications,
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
    const approved = await pe.approveApplicant(req.body);

    res.status(200).json({
      message: "Applicant Approved",
      data: approved,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const bulkApproveApplicants = async (req, res) => {
  try {
    const approved = await pe.bulkApproveApplicants(req.body);

    res.status(200).json({
      message: "Applicant Approved",
      data: approved,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const rejectApplicant = async (req, res) => {
  try {
    const reject = await pe.rejectApplicant({
      application_id: req.params.application_id,
      rejection_reason_id: req.body.rejection_reason_id,
    });

    res.status(200).json({
      message: "Applicant rejected successfully",
      data: reject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getApprovedApplicants = async (req, res) => {
  try {
    const approved = await pe.getApprovedApplicants(req.query.sub_date);

    res.status(200).json({
      data: approved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const enrollApplicant = async (req, res) => {
  try {
    const student = await pe.enrollApplicant({
      app_approval_id: req.params.app_approval_id,
      received_by: req.user.user_id,
    });

    res.status(201).json({
      message: "Enrolling Successful",
      data: student,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

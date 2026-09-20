import React from "react";
import { BrevoClient } from "@getbrevo/brevo";
import { render } from "@react-email/render";
import ApplicationApprovalEmail from "../emails/ApplicationApproval.js";
import { getEmailOfApprovedApplicant } from "../models/emailVerificationModel.js";

export const sendApplicationApproval = async ({
  application_id,
  application_no,
  applicant_name,
  sub_date,
  from_time,
  to_time,
}) => {
  const verification = await getEmailOfApprovedApplicant(application_id);

  if (!verification) {
    throw new Error("Verified email not found for this applicant.");
  }

  const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
  });

  const html = await render(
    React.createElement(ApplicationApprovalEmail, {
      applicationNo: application_no,
      applicantName: applicant_name,
      subDate: sub_date,
      fromTime: from_time,
      toTime: to_time,
    }),
  );

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Application Approved - Grace Christian Academy",
    htmlContent: html,
    sender: {
      name: "Grace Christian Academy",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: verification.email }],
  });
};

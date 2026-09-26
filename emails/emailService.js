import React from "react";
import { BrevoClient } from "@getbrevo/brevo";
import { render } from "@react-email/render";
import ApplicationApprovalEmail from "../emails/ApplicationApproval.js";
import { getEmailOfApprovedApplicant } from "../models/emailVerificationModel.js";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sender = {
  name: "Grace Christian Academy",
  email: process.env.BREVO_SENDER_EMAIL,
};

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
    sender,
    to: [{ email: verification.email }],
  });
};

export const sendAccountActivationEmail = async ({ email, token }) => {
  const activationUrl = `${process.env.FRONTEND_URL}/account-activation?token=${token}`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Activate Your Grace Christian Academy Account",

    textContent: `Hello, Your Grace Christian Academy account has been created. Please use the link below to activate your account and set your password: ${activationUrl} 
    
    This activation link will expire in 24 hours. If you did not expect this email, you may safely ignore it. Grace Christian Academy `,

    sender,

    to: [
      {
        email,
      },
    ],
  });
};

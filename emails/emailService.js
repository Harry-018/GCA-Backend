import React from "react";
import { BrevoClient } from "@getbrevo/brevo";
import { render } from "@react-email/render";
import ApplicationApprovalEmail from "./ApplicationApproval.js";
import TuitionReminderEmail from "./tuitionReminder.js";
import {
  getEmailOfApprovedApplicant,
  getUserAccountEmail,
} from "../models/emailVerificationModel.js";

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

export const sendTeacherRegistrationEmail = async ({ email, token }) => {
  const registrationUrl = `${process.env.FRONTEND_URL}/teacher-registration?token=${token}`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Teacher Registration - Grace Christian Academy",

    textContent: `Hello,
You have been invited to register as a teacher at Grace Christian Academy.

Please use the link below to complete your teacher information:

${registrationUrl}

This registration link will expire in 24 hours and can only be used once.
If you did not expect this invitation, you may safely ignore this email.

Grace Christian Academy`,

    sender,

    to: [
      {
        email,
      },
    ],
  });
};

export const sendAccountActivationEmail = async ({ email, token }) => {
  const activationUrl = `${process.env.FRONTEND_URL}/account-activation?token=${token}`;

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Activate Your Grace Christian Academy Account",

    textContent: `Hello, Your Grace Christian Academy account has been created. Please use the link below to activate your account and set your password:
    
    ${activationUrl} 
    
    This activation link will expire in 24 hours. If you did not expect this email, you may safely ignore it. Grace Christian Academy `,

    sender,

    to: [
      {
        email,
      },
    ],
  });
};

export const sendTuitionReminder = async ({
  email,
  parentName,
  paymentOption,
  templateSubject,
  templateBody,
}) => {
  if (!email) {
    throw new Error("Recipient email is required.");
  }

  const html = await render(
    React.createElement(TuitionReminderEmail, {
      parentName,
      paymentOption,
      templateSubject,
      templateBody,
    }),
  );

  await brevo.transactionalEmails.sendTransacEmail({
    subject: `${templateSubject} - ${paymentOption}`,
    htmlContent: html,
    sender,
    to: [{ email }],
  });
};

export const sendAccountDisabledEmail = async ({ user_id, reason }) => {
  const account = await getUserAccountEmail(user_id);

  if (!account?.email) {
    throw new Error("Account email not found.");
  }

  if (!reason?.trim()) {
    throw new Error("Disable reason is required.");
  }

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Account Disabled - Grace Christian Academy",

    textContent: `Hello,

Your Grace Christian Academy account has been disabled.

Reason for disabling your account:
${reason}

If you believe this action was made in error or have questions regarding your account, please contact the school administration.

Grace Christian Academy`,

    sender,

    to: [
      {
        email: account.email,
      },
    ],
  });
};

export const sendInquiryReplyEmail = async ({
  name,
  email,
  question,
  answer,
}) => {
  if (!email) {
    throw new Error("Recipient email is required.");
  }

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Response to Your Inquiry - Grace Christian Academy",

    textContent: `Hello ${name || "Parent"},

Thank you for contacting Grace Christian Academy.

Here is our response to your inquiry:

Your question:
${question}

Our response:
${answer}

If you have additional questions, feel free to contact us again.

Grace Christian Academy`,

    sender,

    to: [{ email }],
  });
};

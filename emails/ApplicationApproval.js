import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const ApplicationApprovalEmail = ({
  applicationNo,
  applicantName,
  subDate,
  fromTime,
  toTime,
}) => {
  return React.createElement(
    Html,
    null,

    React.createElement(Head, null),

    React.createElement(
      Preview,
      null,
      "Your Grace Christian Academy application has been approved.",
    ),

    React.createElement(
      Body,
      {
        style: {
          margin: 0,
          padding: "40px 0",
          backgroundColor: "#f3e8d3",
          fontFamily: "Arial, sans-serif",
        },
      },

      React.createElement(
        Container,
        {
          style: {
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
          },
        },

        React.createElement(
          Heading,
          {
            style: {
              color: "#97a97c",
              fontSize: "24px",
              marginBottom: "24px",
            },
          },
          "Application Approved!",
        ),

        React.createElement(
          Text,
          {
            style: {
              color: "#3b3b3b",
              fontSize: "15px",
              lineHeight: "1.6",
            },
          },
          `Dear ${applicantName},`,
        ),

        React.createElement(
          Text,
          {
            style: {
              color: "#3b3b3b",
              fontSize: "15px",
              lineHeight: "1.6",
            },
          },
          "We are pleased to inform you that your application to Grace Christian Academy has been approved.",
        ),

        React.createElement(
          Section,
          {
            style: {
              margin: "24px 0",
              padding: "20px",
              backgroundColor: "#f5f6ff",
              borderRadius: "10px",
            },
          },

          React.createElement(
            Text,
            {
              style: {
                margin: "6px 0",
              },
            },
            React.createElement("strong", null, "Application No.: "),
            applicationNo,
          ),

          React.createElement(
            Text,
            {
              style: {
                margin: "6px 0",
              },
            },
            React.createElement("strong", null, "Schedule Date: "),
            subDate,
          ),

          React.createElement(
            Text,
            {
              style: {
                margin: "6px 0",
              },
            },
            React.createElement("strong", null, "Time: "),
            `${fromTime} – ${toTime}`,
          ),
        ),

        React.createElement(
          Text,
          {
            style: {
              color: "#3b3b3b",
              fontSize: "14px",
              lineHeight: "1.6",
            },
          },
          "Please make sure to arrive on time for your scheduled submission and assessment.",
        ),

        React.createElement(
          Text,
          {
            style: {
              color: "#777777",
              fontSize: "13px",
              marginTop: "32px",
            },
          },
          "Grace Christian Academy",
        ),
      ),
    ),
  );
};

export default ApplicationApprovalEmail;

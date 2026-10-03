import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
} from "@react-email/components";

const TuitionReminderEmail = ({ parentName, paymentOption }) => {
  const isPaylite = paymentOption === "Paylite";

  return React.createElement(
    Html,
    null,

    React.createElement(Head, null),

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
          "Tuition Payment Reminder",
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
          `Dear ${parentName},`,
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
          "This is a friendly reminder regarding your child's tuition payment for the current school year.",
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
                color: "#3b3b3b",
                fontSize: "14px",
              },
            },
            React.createElement("strong", null, "Payment Option: "),
            paymentOption,
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
          isPaylite
            ? "Please remember to settle your scheduled Paylite payment according to the school's payment schedule."
            : "Please remember to settle your All-In tuition payment according to the school's payment schedule.",
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
          "If you have already completed your payment, you may disregard this reminder.",
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

export default TuitionReminderEmail;

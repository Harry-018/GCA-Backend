import * as trm from "../models/teacherRegistrationModel.js";

export const createRegistrationInvitation = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const invitation = await trm.createRegistrationInvitation(email);

    res.status(201).json({
      message: "Teacher registration invitation created successfully.",
      data: invitation,
    });
  } catch (error) {
    console.error("Error creating teacher registration invitation:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const submitTeacherRegistration = async (req, res) => {
  try {
    const teacher = await tm.createTeacher(req.body);

    return res.status(201).json({
      message: "Teacher registration submitted successfully.",
      data: teacher,
    });
  } catch (error) {
    console.error("Error submitting teacher registration:", error);

    return res.status(500).json({
      message: "Failed to submit teacher registration.",
    });
  }
};

export const verifyRegistrationInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Registration token is required.",
      });
    }

    const invitation = await trm.getRegistrationInvitation(token);

    if (!invitation) {
      return res.status(404).json({
        message: "Invalid registration invitation.",
      });
    }

    if (!invitation.valid) {
      if (invitation.reason === "used") {
        return res.status(400).json({
          message: "This registration invitation has already been used.",
        });
      }

      if (invitation.reason === "expired") {
        return res.status(400).json({
          message: "This registration invitation has expired.",
        });
      }
    }

    return res.status(200).json({
      message: "Registration invitation is valid.",
      data: invitation,
    });
  } catch (error) {
    console.error("Error verifying teacher registration invitation:", error);

    return res.status(500).json({
      message: "Failed to verify registration invitation.",
    });
  }
};

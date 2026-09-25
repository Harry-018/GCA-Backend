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

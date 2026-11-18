import * as auth from "../models/auth.js";
import { generateToken } from "../functions/tokenGenerator.js";
import { comparePassword } from "../functions/passwordHashing.js";
import { logAdminActivity } from "../models/activityLogsModel.js";

export const authenticateUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }
    const account = await auth.getAccount(email);

    if (!account) {
      return res.status(400).json({ message: "email or password incorrect" });
    }

    if (account.account_status !== "active") {
      return res
        .status(403)
        .json({ message: "Account is pending or disabled" });
    }

    const isMatch = await comparePassword(password, account.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email or password is incorrect" });
    }

    if (isMatch && account.role === "admin") {
      await logAdminActivity({
        user_id: account.user_id,
        user_action: "Logged In",
        user_module: "Authentication",
        description: "Admin successfully logged in.",
      });
    }

    const token = generateToken(
      {
        user_id: account.user_id,
        role: account.role,
      },
      "1hr",
    );

    res.status(200).json({
      message: "success login",
      data: {
        token,
        user: {
          user_id: account.user_id,
          email: account.email,
          role: account.role,
          full_name: `${account.first_name} ${account.last_name}`,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

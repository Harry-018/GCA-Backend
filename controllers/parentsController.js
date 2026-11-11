import * as pm from "../models/parentsModel.js";

export const getParents = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const result = await pm.getParents({
      search,
      page: Number(page),
      limit: Number(limit),
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting parents:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getParentInfoByUserId = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const parent = await pm.getParentInfoByUserId(Number(user_id));

    if (!parent) {
      return res.status(404).json({
        message: "Parent information not found.",
      });
    }

    return res.status(200).json({
      r: parent,
      message: "Parent information retrieved successfully.",
    });
  } catch (error) {
    console.error("getParentInfoByUserId error:", error);

    return res.status(500).json({
      message: "Failed to retrieve parent information.",
    });
  }
};

export const getParentDashboard = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const students = await pm.getParentDashboardStudents(user_id);

    return res.status(200).json({
      success: true,
      message: "Parent dashboard retrieved successfully.",
      data: students,
    });
  } catch (error) {
    console.error("Get Parent Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve parent dashboard.",
    });
  }
};

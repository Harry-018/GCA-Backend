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

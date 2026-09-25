import * as tm from "../models/teachersModel.js";

export const getTeachers = async (req, res) => {
  try {
    const { status = "all", search = "", page = 1, limit = 10 } = req.query;

    const result = await tm.getTeachers({
      status,
      search,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting teachers:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

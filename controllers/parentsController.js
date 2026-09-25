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

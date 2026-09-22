import * as pm from "../models/parentsModel.js";

export const getParents = async (req, res) => {
  try {
    const parents = await pm.getParents();

    res.status(200).json({
      data: parents,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

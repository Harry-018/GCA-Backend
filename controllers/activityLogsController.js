import * as alm from "../models/activityLogsModel.js";

// POST: Create activity log
export const createAdminActivityLog = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    const { user_action, user_module, description } = req.body;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    if (
      !["Created", "Updated", "Deleted", "Rejected", "Logged In"].includes(
        user_action,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity action.",
      });
    }

    if (
      typeof user_module !== "string" ||
      !user_module.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Module and description are required.",
      });
    }

    const result = await alm.logAdminActivity({
      user_id,
      user_action,
      user_module: user_module.trim(),
      description: description.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Activity log created successfully.",
      data: {
        log_id: Number(result.insertId),
      },
    });
  } catch (error) {
    console.error("Create Activity Log Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create activity log.",
    });
  }
};

// GET: Retrieve activity logs
export const getAdminActivityLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const result = await alm.getAdminActivityLogs(page, limit);

    return res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully.",
      data: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error("Get Activity Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve activity logs.",
    });
  }
};

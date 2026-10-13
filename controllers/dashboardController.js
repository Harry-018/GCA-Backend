import {
  getDashboardSchoolYears,
  getDashboardStats,
} from "../models/dashboardModel.js";

export const getDashboard = async (req, res) => {
  try {
    const schoolYears = await getDashboardSchoolYears();

    if (schoolYears.length === 0) {
      return res.status(200).json({
        school_years: [],
        selected_school_year_id: null,
        stats: {
          totalStudents: 0,
          maleStudents: 0,
          femaleStudents: 0,
          disabledStudents: 0,
          fullCashPayments: 0,
          payLitePayments: 0,
          allInPayments: 0,
        },
        message: "No active or archived school years available.",
      });
    }

    const requestedId = req.query.school_year_id
      ? Number(req.query.school_year_id)
      : null;

    if (
      req.query.school_year_id !== undefined &&
      (!Number.isInteger(requestedId) || requestedId <= 0)
    ) {
      return res.status(400).json({
        message: "Invalid school year ID.",
      });
    }

    const activeSchoolYear = schoolYears.find(
      (year) => year.sy_status === "active",
    );

    const selectedSchoolYearId =
      requestedId ?? activeSchoolYear?.school_year_id;

    if (!selectedSchoolYearId) {
      return res.status(200).json({
        school_years: schoolYears,
        selected_school_year_id: null,
        stats: {
          totalStudents: 0,
          maleStudents: 0,
          femaleStudents: 0,
          disabledStudents: 0,
          fullCashPayments: 0,
          payLitePayments: 0,
          allInPayments: 0,
        },
        message: "No active school year available. Select an archived year.",
      });
    }

    const stats = await getDashboardStats(selectedSchoolYearId);

    return res.status(200).json({
      school_years: schoolYears,
      selected_school_year_id: selectedSchoolYearId,
      stats,
      message: "Dashboard data retrieved successfully.",
    });
  } catch (error) {
    console.error("getDashboard error:", error);

    return res.status(500).json({
      message: "Failed to retrieve dashboard data.",
      error: error.message,
    });
  }
};

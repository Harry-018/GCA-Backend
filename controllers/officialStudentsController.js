import * as sm from "../models/officialStudentsModel.js";

export const getStudents = async (req, res) => {
  try {
    const {
      status = "all",
      search = "",
      page = "1",
      limit = "10",
      school_year_id,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        message: "Page and limit must be positive integers.",
      });
    }

    const schoolYears = await sm.getStudentSchoolYears();

    const requestedId =
      school_year_id === undefined ? null : Number(school_year_id);

    if (
      school_year_id !== undefined &&
      (!Number.isInteger(requestedId) || requestedId <= 0)
    ) {
      return res.status(400).json({
        message: "A valid school year ID is required.",
      });
    }

    const activeSchoolYear = schoolYears.find(
      (year) => year.sy_status === "active",
    );

    const selectedSchoolYearId =
      requestedId ?? activeSchoolYear?.school_year_id ?? null;

    if (
      selectedSchoolYearId !== null &&
      !schoolYears.some(
        (year) => Number(year.school_year_id) === selectedSchoolYearId,
      )
    ) {
      return res.status(400).json({
        message: "The selected school year is unavailable.",
      });
    }

    // No active year and no explicit archived year selected.
    if (selectedSchoolYearId === null) {
      return res.status(200).json({
        data: [],
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: 0,
          totalPages: 0,
        },
        school_years: schoolYears,
        selected_school_year_id: null,
        message: "Select a school year to view students.",
      });
    }

    const result = await sm.getStudents({
      status,
      search,
      page: pageNumber,
      limit: limitNumber,
      school_year_id: selectedSchoolYearId,
    });

    return res.status(200).json({
      ...result,
      school_years: schoolYears,
      selected_school_year_id: selectedSchoolYearId,
    });
  } catch (error) {
    console.error("Error getting students:", error);

    return res.status(500).json({
      message: "Failed to retrieve students.",
      error: error.message,
    });
  }
};

export const getStudentInfo = async (req, res) => {
  try {
    const student = await sm.getStudentInfo(req.params.stu_id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    res.status(200).json({
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getStudentEnrollments = async (req, res) => {
  try {
    const enrollments = await sm.getStudentEnrollments(req.params.stu_id);

    res.status(200).json({
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const editStudent = async (req, res) => {
  try {
    const student = await sm.editStudent(req.params.stu_id, req.body);

    res.status(200).json({
      message: "Successfully edited student.",
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

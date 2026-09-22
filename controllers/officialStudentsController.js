import * as sm from "../models/officialStudentsModel.js";

export const getStudents = async (req, res) => {
  try {
    const students = await sm.getStudents(req.query.status);

    res.status(200).json({
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
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

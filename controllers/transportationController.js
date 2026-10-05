import * as tranm from "../models/transporationModel.js";
// ==============================
// GET TRANSPORTATION
// ==============================

export const getTransportation = async (req, res) => {
  try {
    const transportation = await tranm.getTransportation();

    res.status(200).json(transportation);
  } catch (error) {
    console.error("Get transportation error:", error);

    res.status(500).json({
      message: "Failed to get transportation",
    });
  }
};

// ==============================
// ADD TRANSPORTATION
// ==============================

export const addTransportation = async (req, res) => {
  try {
    const result = await tranm.addTransportation({
      location: req.body.location,
      distance: req.body.distance,
      price: req.body.price,
      city: req.body.city,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Add transportation error:", error);

    res.status(500).json({
      message: "Failed to add transportation",
    });
  }
};

// ==============================
// EDIT TRANSPORTATION
// ==============================

export const editTransportation = async (req, res) => {
  try {
    const { transportation_id } = req.params;

    const result = await tranm.editTransportation(Number(transportation_id), {
      location: req.body.location,
      distance: req.body.distance,
      price: req.body.price,
      city: req.body.city,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Edit transportation error:", error);

    res.status(500).json({
      message: "Failed to update transportation",
    });
  }
};

// ==============================
// DELETE TRANSPORTATION
// ==============================

export const deleteTransportation = async (req, res) => {
  try {
    const { transportation_id } = req.params;

    const result = await tranm.deleteTransportation(Number(transportation_id));

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete transportation error:", error);

    res.status(500).json({
      message: "Failed to delete transportation",
    });
  }
};

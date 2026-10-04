import { uploadImage } from "../middleware/cloudinaryMiddleware.js";
import * as hmm from "../models/homepageModel.js";

// ==================== Banner ====================

export const getBanner = async (req, res) => {
  try {
    const banner = await hmm.getBanner();

    res.status(200).json(banner);
  } catch (error) {
    console.error("Get banner error:", error);
    res.status(500).json({
      message: "Failed to get banner",
    });
  }
};

export const editBanner = async (req, res) => {
  try {
    let bannerImage;

    if (req.file) {
      const result = await uploadImage(req.file.buffer, "gca/homepage/banner");

      bannerImage = result.secure_url;
    }

    const result = await hmm.editBanner({
      banner_title: req.body.banner_title,
      banner_quote: req.body.banner_quote,
      banner_image: bannerImage,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Edit banner error:", error);

    res.status(500).json({
      message: "Failed to update banner.",
    });
  }
};
// ==================== Video ====================

export const getVideo = async (req, res) => {
  try {
    const video = await hmm.getVideo();

    res.status(200).json(video);
  } catch (error) {
    console.error("Get video error:", error);
    res.status(500).json({
      message: "Failed to get video",
    });
  }
};

export const editVideo = async (req, res) => {
  try {
    const video = await hmm.editVideo(req.body);

    res.status(200).json({
      message: "Video updated successfully",
      data: video,
    });
  } catch (error) {
    console.error("Edit video error:", error);
    res.status(500).json({
      message: "Failed to update video",
    });
  }
};

// ==================== Choose Us ====================

export const getReason = async (req, res) => {
  try {
    const reason = await hmm.getReasons();

    res.status(200).json(reason);
  } catch (error) {
    console.error("Get reasons error:", error);
    res.status(500).json({
      message: "Failed to get reasons",
    });
  }
};

export const addReason = async (req, res) => {
  try {
    const reason = await hmm.addReason(req.body);

    res.status(201).json({
      message: "Reason added successfully",
      data: reason,
    });
  } catch (error) {
    console.error("Add reason error:", error);
    res.status(500).json({
      message: "Failed to add reason",
    });
  }
};

export const editReason = async (req, res) => {
  try {
    const { reason_id } = req.params;

    const reason = await hmm.editReason(Number(reason_id), req.body);

    res.status(200).json({
      message: "Reason updated successfully",
      data: reason,
    });
  } catch (error) {
    console.error("Edit reason error:", error);
    res.status(500).json({
      message: "Failed to update reason",
    });
  }
};

export const deleteReason = async (req, res) => {
  try {
    const { reason_id } = req.params;

    const reason = await hmm.deleteReason(Number(reason_id));

    res.status(200).json({
      message: "Reason deleted successfully",
      data: reason,
    });
  } catch (error) {
    console.error("Delete reason error:", error);
    res.status(500).json({
      message: "Failed to delete reason",
    });
  }
};

// ==================== Academic Programs ====================

export const getAcademicPrograms = async (req, res) => {
  try {
    const programs = await hmm.getAcademicPrograms();

    res.status(200).json(programs);
  } catch (error) {
    console.error("Get academic programs error:", error);
    res.status(500).json({
      message: "Failed to get academic programs",
    });
  }
};

export const getGradeLevels = async (req, res) => {
  try {
    const gradeLevels = await hmm.getGradeLevels();

    res.status(200).json(gradeLevels);
  } catch (error) {
    console.error("Get grade levels error:", error);
    res.status(500).json({
      message: "Failed to get grade levels",
    });
  }
};

export const addAcademicProgram = async (req, res) => {
  try {
    let imageUrl;

    if (req.file) {
      const result = await uploadImage(
        req.file.buffer,
        "gca/homepage/academic-programs",
      );

      imageUrl = result.secure_url;
    }

    const result = await hmm.addAcademicPrograms({
      grade_level_id: req.body.grade_level_id,
      image_url: imageUrl,
      min_age: req.body.min_age,
      max_age: req.body.max_age,
      description: req.body.description,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Add academic program error:", error);

    res.status(500).json({
      message: "Failed to add academic program",
    });
  }
};

export const editAcademicProgram = async (req, res) => {
  try {
    let imageUrl;

    if (req.file) {
      const result = await uploadImage(
        req.file.buffer,
        "gca/homepage/academic-programs",
      );

      imageUrl = result.secure_url;
    }

    const result = await hmm.editAcademicPrograms(req.params.program_id, {
      grade_level_id: req.body.grade_level_id,
      image_url: imageUrl,
      min_age: req.body.min_age,
      max_age: req.body.max_age,
      description: req.body.description,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Edit academic program error:", error);

    res.status(500).json({
      message: "Failed to update academic program",
    });
  }
};

export const deleteAcademicProgram = async (req, res) => {
  try {
    const result = await hmm.deleteAcademicProgram(req.params.program_id);

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete academic program error:", error);

    res.status(500).json({
      message: "Failed to delete academic program",
    });
  }
};

// ==================== Mission Vision ====================

export const getMissionVision = async (req, res) => {
  try {
    const missionVision = await hmm.getMissionVision();

    res.status(200).json(missionVision);
  } catch (error) {
    console.error("Get mission vision error:", error);
    res.status(500).json({
      message: "Failed to get mission vision",
    });
  }
};

export const editMissionVision = async (req, res) => {
  try {
    const missionVision = await hmm.editMissionVision(req.body);

    res.status(200).json({
      message: "Mission and vision updated successfully",
      data: missionVision,
    });
  } catch (error) {
    console.error("Edit mission vision error:", error);
    res.status(500).json({
      message: "Failed to update mission and vision",
    });
  }
};

// ==================== Children Activities ====================

export const getChildrenActivities = async (req, res) => {
  try {
    const activities = await hmm.getChildrenActivities();

    res.status(200).json(activities);
  } catch (error) {
    console.error("Get children activities error:", error);
    res.status(500).json({
      message: "Failed to get children activities",
    });
  }
};

export const addChildrenActivity = async (req, res) => {
  try {
    const activity = await hmm.addChildrenActivity(req.body);

    res.status(201).json({
      message: "Children activity added successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Add children activity error:", error);
    res.status(500).json({
      message: "Failed to add children activity",
    });
  }
};

export const editChildrenActivity = async (req, res) => {
  try {
    const { activity_id } = req.params;

    const activity = await hmm.editChildrenActivity(
      Number(activity_id),
      req.body,
    );

    res.status(200).json({
      message: "Children activity updated successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Edit children activity error:", error);
    res.status(500).json({
      message: "Failed to update children activity",
    });
  }
};

export const deleteChildrenActivity = async (req, res) => {
  try {
    const { activity_id } = req.params;

    const activity = await hmm.deleteChildrenActivity(Number(activity_id));

    res.status(200).json({
      message: "Children activity deleted successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Delete children activity error:", error);
    res.status(500).json({
      message: "Failed to delete children activity",
    });
  }
};

// controller/exerciseController/clientExerciseController.js
const Client = require("../../model/clientModel");
const Exercise = require("../../model/exerciseModel");
const mongoose = require("mongoose");

// Select an exercise program
const selectExerciseProgram = async (req, res) => {
  try {
    const { clientId, exerciseId } = req.body;

    // Validate input
    if (!clientId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: "Client ID and Exercise ID are required"
      });
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    // Check if exercise exists
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise program not found"
      });
    }

    // Check if client already selected this exercise
    const existingSelectionIndex = client.selectedExercises.findIndex(
      item => item.exercise.toString() === exerciseId && item.active
    );

    if (existingSelectionIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: "Exercise program already selected"
      });
    }

    // Check if it was previously selected but inactive
    const inactiveSelectionIndex = client.selectedExercises.findIndex(
      item => item.exercise.toString() === exerciseId && !item.active
    );

    if (inactiveSelectionIndex !== -1) {
      // Reactivate it
      client.selectedExercises[inactiveSelectionIndex].active = true;
      client.selectedExercises[inactiveSelectionIndex].startDate = Date.now();
    } else {
      // Add new selection
      client.selectedExercises.push({
        exercise: exerciseId,
        startDate: Date.now(),
        active: true
      });
    }

    await client.save();

    res.status(201).json({
      success: true,
      message: "Exercise program selected successfully",
      data: client.selectedExercises.find(item => 
        item.exercise.toString() === exerciseId && item.active
      )
    });
  } catch (error) {
    console.error("Error selecting exercise program:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Remove an exercise program
const removeExerciseProgram = async (req, res) => {
  try {
    const { clientId, exerciseId } = req.params;

    // Validate input
    if (!clientId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: "Client ID and Exercise ID are required"
      });
    }

    // Find the client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    // Find the selected exercise
    const exerciseIndex = client.selectedExercises.findIndex(
      item => item.exercise.toString() === exerciseId && item.active
    );

    if (exerciseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Selected exercise program not found"
      });
    }

    // Set as inactive instead of removing to maintain history
    client.selectedExercises[exerciseIndex].active = false;
    await client.save();

    res.status(200).json({
      success: true,
      message: "Exercise program removed successfully"
    });
  } catch (error) {
    console.error("Error removing exercise program:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all selected exercise programs for a client
const getClientExercisePrograms = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { active } = req.query;

    // Validate input
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required"
      });
    }

    // Find the client and populate exercise data
    const client = await Client.findById(clientId).populate({
      path: "selectedExercises.exercise",
      populate: {
        path: "trainer",
        populate: {
          path: "user",
          select: "userName email profilePicture"
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    // Filter by active status if provided
    let selectedExercises = client.selectedExercises;
    if (active !== undefined) {
      const isActive = active === 'true';
      selectedExercises = selectedExercises.filter(item => item.active === isActive);
    }

    // Sort by most recent first
    selectedExercises.sort((a, b) => b.startDate - a.startDate);

    res.status(200).json({
      success: true,
      count: selectedExercises.length,
      data: selectedExercises
    });
  } catch (error) {
    console.error("Error getting client exercise programs:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  selectExerciseProgram,
  removeExerciseProgram,
  getClientExercisePrograms
};
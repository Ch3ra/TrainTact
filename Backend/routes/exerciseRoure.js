const express = require("express");
const router = express.Router();
const {
  handleExerciseUpload,
  createExercise,
  getExercises,
  getExerciseById,
  updateExercise,
  deleteExercise
} = require("../controller/exerciseController/exerciseController");

// Create a new exercise with file upload
router.post('/', handleExerciseUpload, createExercise);

// Get all exercises
router.get('/', getExercises);

// Get exercise by ID
router.get('/:id', getExerciseById);

// Update exercise with file upload
router.put('/:id', handleExerciseUpload, updateExercise);

// Delete exercise
router.delete('/:id', deleteExercise);

module.exports = router;
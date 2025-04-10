// routes/clientExerciseRoutes.js
const express = require("express");
const { selectExerciseProgram, getClientExercisePrograms, removeExerciseProgram } = require("../controller/exerciseController/clientExerciseController");
const router = express.Router();


// Select an exercise program
router.post('/select', selectExerciseProgram);

// Get all selected exercise programs for a client
router.get('/:clientId', getClientExercisePrograms);

// Remove an exercise program
router.delete('/:clientId/:exerciseId', removeExerciseProgram);

module.exports = router;
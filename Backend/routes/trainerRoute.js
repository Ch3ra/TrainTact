const { getAllTrainers, deleteTrainer, updateOtpVerification } = require("../controller/trainerController/trainerController");
const Trainer = require("../model/trainerModel");  // Renamed for consistency
const User = require("../model/userModel");
const router = require("express").Router();
const { upload } = require("./../middleware/multerConfig");

// Existing routes
router.get("/getAllTrainers", getAllTrainers);
router.delete("/deleteTrainer/:id", deleteTrainer);

// New route to update OTP verification
router.patch("/updateOtpVerification/:id", updateOtpVerification);

// Endpoint to get full trainer profile by user ID
router.get("/details/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch trainer information including linked user details
    const trainer = await Trainer.findOne({ user: userId })
      .populate({
        path: 'user',
        select: '-password' // Exclude the password field
      });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // Construct a detailed response object
    const response = {
      message: "Trainer profile fetched successfully.",
      trainer: {
        
        userName: trainer.user.userName,
        email: trainer.user.email,
        
        profilePicture: trainer.user.profilePicture,
        fitnessGoal: trainer.user.fitnessGoal,
        location: trainer.user.location,
        yearsOfExperience: trainer.yearsOfExperience,
        price: trainer.price,
        availabilityHours: trainer.availabilityHours,
        description: trainer.description,
        startDay: trainer.startDay,
        endDay: trainer.endDay,
        coverPhoto: trainer.coverPhoto,
        advancedNeeded: trainer.advancedNeeded 
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching trainer information:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
// yo vanako xai description ama 
router.post('/add/:userId', upload.single('coverPhoto'), async (req, res) => {
  const { userId } = req.params;
  const {
      price, availabilityHours, description,
      fitnessGoal, location, startDay, endDay,
      advancedNeeded
  } = req.body;

  // Get just the filename from Multer
  const coverPhoto = req.file ? req.file.filename : null;

  try {
      const user = await User.findById(userId);
      if (!user || user.role !== "Trainer") {
          return res.status(404).json({ message: "Trainer not found or user is not a trainer." });
      }

      let trainer = await Trainer.findOne({ user: userId });
      if (trainer) {
          trainer.price = price;
          trainer.availabilityHours = availabilityHours;
          trainer.description = description;
          trainer.startDay = startDay;
          trainer.endDay = endDay;
          trainer.advancedNeeded = advancedNeeded === 'true' || advancedNeeded === true;
          if (coverPhoto) trainer.coverPhoto = coverPhoto;
          await trainer.save();
      } else {
          trainer = await Trainer.create({
              user: userId,
              price,
              availabilityHours,
              description,
              startDay,
              endDay,
              coverPhoto,
              advancedNeeded: advancedNeeded === 'true' || advancedNeeded === true
          });
      }

      user.fitnessGoal = fitnessGoal;
      user.location = location;
      await user.save();

      res.status(200).json({
          message: "Trainer profile updated successfully",
          trainer,
          user
      });
  } catch (error) {
      console.error("Error updating trainer profile:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
  }
});



  // API to update an existing trainer's profile comprehensively
// router.patch(
//     "/trainer/:userId",
//     upload.fields([
//         { name: "coverPhoto", maxCount: 1 },
//         { name: "profilePicture", maxCount: 1 }
//     ]), // Handles file uploads for cover photo and profile picture
//     async (req, res) => {
//       try {
//         const { userId } = req.params;
//         const { userName, email, fitnessGoal, location, yearsOfExperience, price, availabilityTime, description, availableDays } = req.body;
//         const coverPhoto = req.files?.coverPhoto?.[0]?.filename || null;
//         const profilePicture = req.files?.profilePicture?.[0]?.filename || null;

//         // Fetch the user and ensure they are a trainer
//         const user = await User.findById(userId);
//         if (!user || user.role !== "Trainer") {
//           return res.status(404).json({ message: "Trainer not found or user is not a trainer." });
//         }

//         // Update user details
//         user.userName = userName || user.userName;
//         user.email = email || user.email;
//         user.profilePicture = profilePicture || user.profilePicture;
//         user.fitnessGoal = fitnessGoal || user.fitnessGoal;
//         user.location = location || user.location;
//         await user.save();

//         // Fetch and update trainer details
//         let trainer = await Trainer.findOne({ user: userId });
//         if (!trainer) {
//           trainer = await Trainer.create({ user: userId });
//         }
        
//         trainer.yearsOfExperience = yearsOfExperience || trainer.yearsOfExperience;
//         trainer.price = price || trainer.price;
//         trainer.availabilityTime = availabilityTime || trainer.availabilityTime;
//         trainer.description = description || trainer.description;
//         trainer.availableDays = availableDays || trainer.availableDays;
//         trainer.coverPhoto = coverPhoto || trainer.coverPhoto;
//         await trainer.save();

//         res.status(200).json({
//           message: "Trainer details updated successfully.",
//           profile: {
//             userName: user.userName,
//             email: user.email,
//             profilePicture: user.profilePicture,
//             fitnessGoal: user.fitnessGoal,
//             location: user.location,
//             yearsOfExperience: trainer.yearsOfExperience,
//             price: trainer.price,
//             availabilityTime: trainer.availabilityTime,
//             description: trainer.description,
//             availableDays: trainer.availableDays,
//             coverPhoto: trainer.coverPhoto
//           }
//         });
//       } catch (error) {
//         console.error("Error updating trainer details:", error);
//         res.status(500).json({ message: "Internal server error.", error: error.message });
//       }
//     }
// );



//NEW
router.patch(
  "/trainer/:userId",
  upload.fields([
      { name: "coverPhoto", maxCount: 1 },
      { name: "profilePicture", maxCount: 1 }
  ]), // Handles file uploads for cover photo and profile picture
  async (req, res) => {
      try {
          const { userId } = req.params;
          const { userName, email, fitnessGoal, location, yearsOfExperience, price, availabilityTime, description, availableDays, advancedNeeded } = req.body;
          const coverPhoto = req.files?.coverPhoto?.[0]?.filename || null;
          const profilePicture = req.files?.profilePicture?.[0]?.filename || null;

          // Fetch the user and ensure they are a trainer
          const user = await User.findById(userId);
          if (!user || user.role !== "Trainer") {
              return res.status(404).json({ message: "Trainer not found or user is not a trainer." });
          }

          // Update user details
          user.userName = userName || user.userName;
          user.email = email || user.email;
          user.profilePicture = profilePicture || user.profilePicture;
          user.fitnessGoal = fitnessGoal || user.fitnessGoal;
          user.location = location || user.location;
          await user.save();

          // Fetch and update trainer details
          let trainer = await Trainer.findOne({ user: userId });
          if (!trainer) {
              trainer = await Trainer.create({ user: userId });
          }

          trainer.yearsOfExperience = yearsOfExperience || trainer.yearsOfExperience;
          trainer.price = price || trainer.price;
          trainer.availabilityTime = availabilityTime || trainer.availabilityTime;
          trainer.description = description || trainer.description;
          trainer.availableDays = availableDays || trainer.availableDays;
          trainer.coverPhoto = coverPhoto || trainer.coverPhoto;

          // Update advancedNeeded field (pre-fill if not provided, update if changed)
          trainer.advancedNeeded = advancedNeeded !== undefined ? (advancedNeeded === 'true' || advancedNeeded === true) : trainer.advancedNeeded;
          await trainer.save();

          res.status(200).json({
              message: "Trainer details updated successfully.",
              profile: {
                  userName: user.userName,
                  email: user.email,
                  profilePicture: user.profilePicture,
                  fitnessGoal: user.fitnessGoal,
                  location: user.location,
                  yearsOfExperience: trainer.yearsOfExperience,
                  price: trainer.price,
                  availabilityTime: trainer.availabilityTime,
                  description: trainer.description,
                  availableDays: trainer.availableDays,
                  coverPhoto: trainer.coverPhoto,
                  advancedNeeded: trainer.advancedNeeded // Include advancedNeeded in the response
              }
          });
      } catch (error) {
          console.error("Error updating trainer details:", error);
          res.status(500).json({ message: "Internal server error.", error: error.message });
      }
  }
);


router.get('/completeProfiles', async (req, res) => {
  try {
    const BASE_URL = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/profilePictures/`;
    console.log("BASE_URL:", BASE_URL);

    // Fetch all trainers
    const trainers = await Trainer.find({}).populate({
      path: 'user',
      select: 'userName profilePicture fitnessGoal'
    });

    console.log("Raw Trainer Data:", trainers);

    // Filter trainers to include only those with a defined, non-empty fitnessGoal
    const completeTrainers = trainers.filter(trainer => 
      trainer.user &&
      trainer.user.fitnessGoal &&
      trainer.user.fitnessGoal.trim() !== ''
    );

    if (!completeTrainers.length) {
      console.log("No trainers with complete profiles found.");
      return res.status(404).json({ message: "No trainers with complete profiles found." });
    }

    const trainersData = completeTrainers.map(trainer => ({
      
      ID : trainer.user && trainer.user.id,
      username: trainer.user ? trainer.user.userName : 'No username',
      fitnessGoal: trainer.user ? trainer.user.fitnessGoal : 'No fitnessGoal',
      profilePicture: trainer.user && trainer.user.profilePicture
        ? (trainer.user.profilePicture.startsWith('http') 
            ? trainer.user.profilePicture 
            : BASE_URL + trainer.user.profilePicture)
        : BASE_URL + 'default.png',
    }));

    console.log("Fetched Trainers Data:", trainersData);
    res.status(200).json({
      success: true,
      message: "Fetched trainers with complete profiles successfully",
      data: trainersData,
    });
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trainers",
      error: error.message,
    });
  }
});



module.exports = router;

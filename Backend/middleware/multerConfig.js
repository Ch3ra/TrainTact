const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Dynamically set the folder based on the file field name
    const uploadFolder =
    file.fieldname === "profilePicture"
      ? "./uploads/profilePictures"
      : "./uploads/resumes";
    cb(null, uploadFolder); // Ensure these folders exist
  },
  filename: function (req, file, cb) {
    // Use a unique filename with a timestamp to prevent conflicts
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

// Middleware for handling uploads
const upload = multer({ storage });

module.exports = {
  multer,
  storage,
  upload,
};

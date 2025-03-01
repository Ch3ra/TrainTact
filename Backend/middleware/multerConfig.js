const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadFolder = "./uploads"; // Default folder if none matches

    if (file.fieldname === "profilePicture") {
      uploadFolder = "./uploads/profilePictures";
    } else if (file.fieldname === "resume") {
      uploadFolder = "./uploads/resumes";
    } else if (file.fieldname === "coverPhoto") {
      uploadFolder = "./uploads/coverPhoto"; // Handling uploads to the coverPhoto folder
    }

    cb(null, uploadFolder); // Set the destination folder
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

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadFolder = "./uploads";

    if (file.fieldname === "profilePicture") {
      uploadFolder = "./uploads/profilePictures";
    } else if (file.fieldname === "resume") {
      uploadFolder = "./uploads/resumes";
    } else if (file.fieldname === "coverPhoto") {
      uploadFolder = "./uploads/coverPhoto";
    }

    cb(null, uploadFolder); 
  },
  filename: function (req, file, cb) {
    
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

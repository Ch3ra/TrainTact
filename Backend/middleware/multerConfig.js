const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadFolder = "./uploads";
    if (file.fieldname === "files") {
      uploadFolder = "./uploads/chatFiles";
    }
    else if (file.fieldname === "profilePicture") {
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

const chatUpload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    // Allow only images, docs, etc.
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Middleware for handling uploads
const upload = multer({ storage });

module.exports = {
  multer,
  storage,
  upload, 
  chatUpload
};
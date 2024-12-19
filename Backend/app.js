const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware and route imports
const authRoutes = require("./routes/authRoute");

// Ensure upload folders exist
const paths = ["./uploads/profilePictures", "./uploads/resumes"];
paths.forEach((uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Created folder: ${uploadPath}`);
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require("cors");
app.use(cors());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test API to check if server is live or not
app.get("/", (req, res) => {
  res.status(200).json({
    message: "I am alive",
  });
});

// Routes
app.use("/api/auth", authRoutes);

// Database connection
const { connectDatabase } = require("./database/database");
connectDatabase();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

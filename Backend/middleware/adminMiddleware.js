// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

/**
 * Regular authentication middleware
 * Verifies the JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. No token provided.",
      });
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        message: "Authentication required. Invalid token format.",
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(401).json({
          message: "User not found or deleted.",
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token expired. Please login again.",
        });
      }
      
      return res.status(401).json({
        message: "Invalid token.",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Internal server error in authentication.",
    });
  }
};

/**
 * Admin authentication middleware
 * Extends regular auth middleware and checks for admin role
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // First run the regular auth middleware
    authMiddleware(req, res, () => {
      // Check if user exists and has admin role
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required.",
        });
      }
      
      if (!req.user.isAdmin) {
        return res.status(403).json({
          message: "Admin access required for this resource.",
        });
      }
      
      // User is authenticated and has admin privileges
      next();
    });
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return res.status(500).json({
      message: "Internal server error in admin authentication.",
    });
  }
};

module.exports = {
  authMiddleware,
  adminAuthMiddleware,
};
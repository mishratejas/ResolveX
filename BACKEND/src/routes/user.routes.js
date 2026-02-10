import express from "express";
import {
  userSignup,
  userLogin,
  refreshToken,
  logout,
  getUserProfile,
  updateUserProfile
} from "../controllers/user.controllers.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Auth routes
router.post("/signup", userSignup);
router.post("/login", userLogin);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected routes
router.get("/profile", auth, getUserProfile);
router.put("/profile", auth, updateUserProfile);

// Debug route
router.get("/debug/all-users", async (req, res) => {
  try {
    const User = require("../models/User.models.js").default || require("../models/User.models.js");
    const users = await User.find({}).select("-password");
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users"
    });
  }
});

export default router;
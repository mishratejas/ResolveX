import express from "express";
import {
  userSignup,
  userLogin,
  refreshToken,
  logout,
  getUserProfile,
  updateUserProfile,
  joinWorkspace,        
  leaveWorkspace,       
  getMyWorkspaces       
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

// Workspace management routes
router.post("/join-workspace", auth, joinWorkspace);
router.post("/leave-workspace/:workspaceId", auth, leaveWorkspace);
router.get("/my-workspaces", auth, getMyWorkspaces);

export default router;
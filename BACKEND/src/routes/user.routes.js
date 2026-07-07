import express from "express";
import {
  userLogin,
  refreshToken,
  logout,
  getUserProfile,
  updateUserProfile,
  joinWorkspace,        
  leaveWorkspace,       
  getMyWorkspaces,
  changePassword
} from "../controllers/user.controllers.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Auth routes
// NOTE: User signup now lives at POST /api/otp/signup/user (otp.routes.js),
// which actually verifies the OTP before creating the account.
router.post("/login", userLogin);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected routes
router.get("/profile", auth, getUserProfile);
router.put("/profile", auth, updateUserProfile);

// route; it previously didn't exist here at all.
router.put("/change-password", auth, changePassword);

// Workspace management routes
router.post("/join-workspace", auth, joinWorkspace);
router.post("/leave-workspace/:workspaceId", auth, leaveWorkspace);
router.get("/my-workspaces", auth, getMyWorkspaces);

export default router;
import User from "../models/User.models.js";
import OTP from "../models/otp.model.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { issueAuthTokens } from "../utils/authTokens.js";
// been removed. It duplicated almost all of userSignupWithOTP's logic but
// never actually checked the OTP it received, so it was a backdoor around
// email verification. All user signups now go through
// `userSignupWithOTP` (controllers/otp.controllers.js, POST /api/otp/signup/user),
// which is wired into the live signup flow already.

//Login controller

export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt for:', email);
        
        //Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: email }, { phone: email }],
        });

        if (!user) {
            console.log('User not found:', email);
            return res.status(404).json({
                message: "User not found"
            });
        }

        console.log('User found:', user.email);
        console.log('Comparing passwords...');

        //Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        
        console.log(' Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password mismatch for:', email);
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        
        console.log('Password matched! Generating tokens...');
        
        //Generate JWT + set refresh cookie
        const accessToken = issueAuthTokens(res, { id: user._id, role: user.role || "user" });

        console.log('Login successful for:', user.email);

        res.status(200).json({
            message: "Login Successful",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("User login error: ", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Refresh token controller
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required"
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Generate new access token
        const payload = { id: user._id, role: user.role || "user" };
        const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });

        res.json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Refresh token error:", error);

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error refreshing token"
        });
    }
};

// Logout controller
export const logout = (req, res) => {
    res.clearCookie("refreshToken");
    res.json({
        success: true,
        message: "Logged out successfully"
    });
};

//controller for user_profile
export const getUserProfile = async (req, res) => {
    try {
        // The 'auth' middleware has already found the user and attached it to req.user.
        // We just need to send it back. The password has already been removed by the middleware.
        const user = req.user;

        res.status(200).json({
            success: true,
            message: "Profile data fetched successfully",
            data: user
        });

    } catch (error) {
        console.error("Get User Profile Error: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

//for editing the user's details
export const updateUserProfile = async (req, res) => {
    try {
        // The user's ID is attached to the request by your auth middleware
        const userId = req.user.id; 

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get the fields from the request body
        const { name, phone, address, profileImage } = req.body;

        // Update only the fields that were provided in the request
        user.name = name || user.name;
        user.phone = phone || user.phone;

        // The profileImage will be a URL string from Cloudinary, sent by the frontend
        if (profileImage) {
            user.profileImage = profileImage;
        }

        // Update address fields if an address object is provided
        if (address) {
            user.address.street = address.street || user.address.street;
            user.address.city = address.city || user.address.city;
            user.address.state = address.state || user.address.state;
            user.address.pincode = address.pincode || user.address.pincode;
        }

        const updatedUser = await user.save();

        // Send back the updated user data (excluding the password)
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                profileImage: updatedUser.profileImage,
                createdAt: updatedUser.createdAt
            }
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Server error while updating profile" });
    }
};

// Join a workspace using workspace code
export const joinWorkspace = async (req, res) => {
    try {
        const { workspaceCode } = req.body;
        const userId = req.user._id;

        console.log('Join Workspace Request:', { workspaceCode, userId });

        if (!workspaceCode) {
            return res.status(400).json({
                success: false,
                message: "Workspace code is required"
            });
        }

        // Find admin/workspace by code
        const Admin = (await import("../models/Admin.models.js")).default;
        const admin = await Admin.findOne({ 
            workspaceCode: workspaceCode.toUpperCase() 
        }).select('organizationName workspaceCode email');

        if (!admin) {
            console.log('Workspace not found:', workspaceCode);
            return res.status(404).json({
                success: false,
                message: "Invalid workspace code. Please check and try again."
            });
        }

        // Get user
        const user = await User.findById(userId);

        // Check if already joined
        const alreadyJoined = user.joinedWorkspaces.some(
            (wsId) => wsId.toString() === admin._id.toString()
        );
        if (alreadyJoined) {
            return res.status(400).json({
                success: false,
                message: "You are already a member of this workspace"
            });
        }

        // Add workspace to user
        user.joinedWorkspaces.push(admin._id);
        await user.save();

        console.log('User joined workspace:', {
            userId,
            workspace: admin.organizationName,
            code: admin.workspaceCode
        });

        // Return updated user with populated workspaces
        const updatedUser = await User.findById(userId)
            .select("-password")
            .populate({
                path: 'joinedWorkspaces',
                select: 'organizationName workspaceCode email profileImage'
            });

        res.status(200).json({
            success: true,
            message: `Successfully joined ${admin.organizationName}!`,
            data: {
                joinedWorkspaces: updatedUser.joinedWorkspaces,
                newWorkspace: {
                    id: admin._id,
                    name: admin.organizationName,
                    code: admin.workspaceCode
                }
            }
        });

    } catch (error) {
        console.error("Join Workspace Error:", error);
        res.status(500).json({
            success: false,
            message: "Error joining workspace. Please try again."
        });
    }
};

// Leave a workspace
export const leaveWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user._id;

        console.log('Leave Workspace Request:', { workspaceId, userId });

        const user = await User.findById(userId);

        // Check if user is in this workspace
        const isMember = user.joinedWorkspaces.some(
            (wsId) => wsId.toString() === workspaceId.toString()
        );
        if (!isMember) {
            return res.status(400).json({
                success: false,
                message: "You are not a member of this workspace"
            });
        }

        // Prevent leaving if it's the only workspace
        if (user.joinedWorkspaces.length === 1) {
            return res.status(400).json({
                success: false,
                message: "You must be in at least one workspace. Join another workspace before leaving this one."
            });
        }

        // Remove workspace
        user.joinedWorkspaces = user.joinedWorkspaces.filter(
            id => id.toString() !== workspaceId
        );
        await user.save();

        console.log('User left workspace:', { userId, workspaceId });

        // Return updated workspaces
        const updatedUser = await User.findById(userId)
            .select("-password")
            .populate({
                path: 'joinedWorkspaces',
                select: 'organizationName workspaceCode email profileImage'
            });

        res.status(200).json({
            success: true,
            message: "Successfully left workspace",
            data: {
                joinedWorkspaces: updatedUser.joinedWorkspaces
            }
        });

    } catch (error) {
        console.error("Leave Workspace Error:", error);
        res.status(500).json({
            success: false,
            message: "Error leaving workspace"
        });
    }
};

//  Get user's workspaces
export const getMyWorkspaces = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .select("joinedWorkspaces")
            .populate({
                path: 'joinedWorkspaces',
                select: 'organizationName workspaceCode email phone profileImage createdAt',
                populate: {
                    path: 'permissions',
                    select: 'canAssign canResolve canDelete'
                }
            });

        res.status(200).json({
            success: true,
            count: user.joinedWorkspaces.length,
            data: user.joinedWorkspaces
        });

    } catch (error) {
        console.error("Get Workspaces Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching workspaces"
        });
    }
};
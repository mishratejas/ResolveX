import Staff from "../models/Staff.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getRefreshCookieOptions } from "../utils/authTokens.js";

// ==================== PUBLIC ROUTES (STAFF APP) ====================
// NOTE: Staff registration now lives at POST /api/otp/signup/staff (otp.routes.js),
// which actually verifies the OTP before creating the account.

export const staffLogin = async (req, res) => {
    try {
        const { staffIdOrEmail, password } = req.body; 
        
        if (!staffIdOrEmail || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        
        const staff = await Staff.findOne({
            $or: [{ email: staffIdOrEmail }, { staffId: staffIdOrEmail }], 
        }).populate('department', 'name category');
        
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff not found or Invalid Credentials" });
        }
        
        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid Credentials" });
        } 

        // We let them log in so the frontend can redirect them to the beautiful "Waiting Room" screen.
        
        const payload = { id: staff._id, role: staff.role || "staff" };
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        
        res.cookie("staffRefreshToken", refreshToken, {
            ...getRefreshCookieOptions(req),
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });
        
        res.status(200).json({ 
            success: true,
            message: "Staff Login Successful", 
            accessToken,
            staff: {
                _id: staff._id,
                name: staff.name,
                role: staff.role,
                staffId: staff.staffId,
                email: staff.email,
                department: staff.department,
                phone: staff.phone,
                profileImage: staff.profileImage || "", 
                isApproved: staff.isApproved //Send this so StaffDashboard knows to show the waiting room!
            }
        });
        
    } catch (err) {
        console.error("Staff Login Error:", err);
        res.status(500).json({ success: false, message: "Server Error during staff login." });
    }
};

// Refresh token controller — reissues a short-lived access token using the
// HttpOnly staffRefreshToken cookie set at login.
export const staffRefreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.staffRefreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token required" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const staff = await Staff.findById(decoded.id).populate('department', 'name category');
        if (!staff) {
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        const payload = { id: staff._id, role: staff.role || "staff" };
        const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" });

        res.json({
            success: true,
            accessToken: newAccessToken,
            staff: {
                _id: staff._id,
                name: staff.name,
                role: staff.role,
                staffId: staff.staffId,
                email: staff.email,
                department: staff.department,
                phone: staff.phone,
                profileImage: staff.profileImage || "",
                isApproved: staff.isApproved
            }
        });
    } catch (error) {
        console.error("Staff refresh token error:", error);

        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
        }

        res.status(500).json({ success: false, message: "Server error refreshing token" });
    }
};

export const staffLogout = (req, res) => {
    res.clearCookie("staffRefreshToken", getRefreshCookieOptions(req));
    res.status(200).json({ success: true, message: "Staff logged out successfully" });
};

export const getStaffProfile = async (req, res) => {
    try {
        // Grab ID from the auth middleware token
        const staffId = req.user?.id || req.staff?.id || req.user?._id; 
        
        const staff = await Staff.findById(staffId).populate('department', 'name category');
        
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff not found" });
        }
        
        res.status(200).json({ 
            success: true, 
            staff: {
                _id: staff._id,
                name: staff.name,
                role: staff.role,
                staffId: staff.staffId,
                email: staff.email,
                department: staff.department,
                phone: staff.phone,
                profileImage: staff.profileImage || "", 
                isApproved: staff.isApproved 
            } 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error fetching profile." });
    }
};

//Let a staff member update their own profile (name, phone, profile photo)
export const updateStaffProfile = async (req, res) => {
    try {
        // staffAuth middleware attaches the staff doc (minus password) to req.staff
        const staffId = req.staff?._id || req.staff?.id || req.user?.id;

        if (!staffId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff not found" });
        }

        const { name, phone, profileImage } = req.body;

        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (profileImage !== undefined) staff.profileImage = profileImage;

        await staff.save();

        const updatedStaff = await Staff.findById(staffId).populate('department', 'name category');

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            staff: {
                _id: updatedStaff._id,
                name: updatedStaff.name,
                role: updatedStaff.role,
                staffId: updatedStaff.staffId,
                email: updatedStaff.email,
                department: updatedStaff.department,
                phone: updatedStaff.phone,
                profileImage: updatedStaff.profileImage || "",
                isApproved: updatedStaff.isApproved
            }
        });
    } catch (error) {
        console.error("Error updating staff profile:", error);
        res.status(500).json({ success: false, message: "Server error while updating profile" });
    }
};

// 1. Get all PENDING staff for the logged-in Admin
export const getPendingStaff = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;

        if (!currentAdminId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const pendingStaff = await Staff.find({ adminId: currentAdminId, isApproved: false })
            .select('-password')
            .populate('department', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pendingStaff.length,
            data: pendingStaff
        });
    } catch (error) {
        console.error("Error fetching pending staff:", error);
        res.status(500).json({ success: false, message: "Server error while fetching pending staff" });
    }
};

// 2. Approve a staff member
export const approveStaff = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        const { id } = req.params;

        const staffToApprove = await Staff.findOneAndUpdate(
            { _id: id, adminId: currentAdminId },
            { $set: { isApproved: true } },
            { new: true }
        ).select('-password');

        if (!staffToApprove) {
            return res.status(404).json({ success: false, message: "Staff member not found or does not belong to your workspace" });
        }

        res.status(200).json({
            success: true,
            message: `${staffToApprove.name} has been successfully approved!`,
            data: staffToApprove
        });
    } catch (error) {
        console.error("Error approving staff:", error);
        res.status(500).json({ success: false, message: "Server error while approving staff" });
    }
};

// 3. Reject (Delete) a staff member
export const rejectStaff = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        const { id } = req.params;

        const rejectedStaff = await Staff.findOneAndDelete({ 
            _id: id, 
            adminId: currentAdminId,
            isApproved: false 
        });

        if (!rejectedStaff) {
            return res.status(404).json({ success: false, message: "Pending staff member not found" });
        }

        res.status(200).json({
            success: true,
            message: `${rejectedStaff.name}'s request has been rejected and removed.`
        });
    } catch (error) {
        console.error("Error rejecting staff:", error);
        res.status(500).json({ success: false, message: "Server error while rejecting staff" });
    }
};
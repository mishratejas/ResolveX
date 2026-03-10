import jwt from "jsonwebtoken";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Admin from "../models/Admin.models.js";

export const chatAuth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Try to find user in User, Staff, or Admin collections
        let user = await User.findById(decoded.id).select("-password");
        if (user) {
            req.user = user;
            return next();
        }

        let staff = await Staff.findById(decoded.id).select("-password");
        if (staff) {
            req.staff = staff;
            return next();
        }

        let admin = await Admin.findById(decoded.id).select("-password");
        if (admin) {
            req.admin = admin;
            return next();
        }

        return res.status(401).json({
            success: false,
            message: "Invalid token. User not found."
        });

    } catch (error) {
        // Only log unexpected errors - TokenExpiredError is normal expected behaviour
        if (error.name !== "TokenExpiredError" && error.name !== "JsonWebTokenError") {
            console.error("Chat auth error:", error);
        }
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });
        }
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired."
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error in authentication."
        });
    }
};
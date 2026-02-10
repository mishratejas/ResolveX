import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    }

    // Handle mongoose validation errors
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message
        }));
        
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: errors
        });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `Duplicate ${field} value`,
            error: `A record with this ${field} already exists`
        });
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token expired"
        });
    }

    // Default error
    console.error("Error:", err);
    
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};
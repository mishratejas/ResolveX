import User from "../models/User.models.js";
import OTP from "../models/otp.model.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//signup ke liye

export const userSignup = async (req, res) => {
    try {
        // 1. Get all data from the request body
        const { name, email, password, phone, street, city, state, pincode, otp } = req.body;

        console.log('📥 Signup Request Body:', req.body);
        
        // 2. Validate all required fields
        if (!name || !email || !password || !phone) {
            console.log('❌ Missing fields:', { name, email, password, phone });
            return res.status(400).json({ 
                success: false,
                message: "Please fill all required fields: name, email, password, phone." 
            });
        }

        // 3. Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ 
                success: false,
                message: "Email or phone already registered" 
            });
        }

        // 🔧 FIX: REMOVED MANUAL HASHING
        // Let the User model's pre-save hook handle password hashing
        // This prevents double hashing issue
        
        // 4. Create the new user (password will be hashed by pre-save hook)
        const newUser = new User({
            name,
            email,
            password: password,  // ← FIXED: Pass plain password, let model hash it
            phone,
            address: {
                street: street || "",
                city: city || "",
                state: state || "",
                pincode: pincode || "",
            },
            isVerified: true
        });

        console.log('📝 User object created (password will be auto-hashed on save)');

        // 5. Save user to database (pre-save hook will hash password)
        try {
            await newUser.save();
            console.log('💾 User saved to database with ID:', newUser._id);
        } catch (saveError) {
            console.error('❌ Error saving user:', saveError);
            throw saveError;
        }

        // 6. Verify the user was actually saved
        const savedUser = await User.findById(newUser._id);
        if (!savedUser) {
            throw new Error('User was not saved to database');
        }
        console.log('✅ User verified in database:', savedUser._id);

        // 7. Generate tokens
        const payload = { id: newUser._id, role: newUser.role || "user" };
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        // 8. Send refresh token as a cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // 9. Send the final JSON response
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            accessToken,  // ← FIXED: Return at root level for frontend
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address,
                role: newUser.role,
            }
        });

    } catch (err) {
        console.error("❌ User Signup Error: ", err);
        
        // Check for MongoDB validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: `Validation Error: ${err.message}`
            });
        }
        
        // Check for MongoDB duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Duplicate key error. Email or phone already exists."
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: "Server Error" 
        });
    }
};


//Login controller

export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt for:', email);
        
        //Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: email }, { phone: email }],
        });

        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(404).json({
                message: "User not found"
            });
        }

        console.log('✅ User found:', user.email);
        console.log('🔍 Comparing passwords...');

        //Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        
        console.log('🔐 Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('❌ Password mismatch for:', email);
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        
        console.log('✅ Password matched! Generating tokens...');
        
        //Generate JWT
        const payload = { id: user._id, role: user.role || "user" };

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        //Send refresh token as HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log('✅ Login successful for:', user.email);

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
        console.error("❌ User login error: ", err);
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
        const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

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
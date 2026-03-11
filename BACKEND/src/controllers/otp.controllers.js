import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { sendEmail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Admin from "../models/Admin.models.js";
import OTP from "../models/otp.model.js";
import Department from "../models/Department.model.js";

// Generate OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Send OTP for Email
const sendOTPEmail = async (email, otp, purpose) => {
    const subject = purpose === 'signup' ? 'Verify Your Email - OTP' :
                   purpose === 'login' ? 'Login OTP Verification' :
                   purpose === 'password-reset' ? 'Password Reset OTP' :
                   'Email Verification OTP';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .otp-box { background: #f4f4f4; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
                .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>OTP Verification</h2>
                <p>Your One-Time Password (OTP) for ${purpose} is:</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p>This OTP will expire in <strong>10 minutes</strong>.</p>
                <p class="warning">⚠️ Do not share this OTP with anyone. Our team will never ask for your OTP.</p>
                <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
        </body>
        </html>
    `;

    await sendEmail(email, subject, `Your OTP is: ${otp}`, html);
};

// Send OTP for Phone
const sendOTPSMS = async (phone, otp, purpose) => {
    const message = `Your OTP for ${purpose} is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
    await sendSMS(phone, message);
};

// Request OTP for Signup/Login
export const requestOTP = asyncHandler(async (req, res) => {
    const { identifier, type = 'email', purpose, userType = 'user' } = req.body;

    console.log('📱 Request OTP called:', { identifier, type, purpose, userType });

    if (!identifier) {
        throw new ApiError(400, "Email or phone number is required");
    }

    // Validate identifier format
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^[0-9]{10}$/.test(identifier);

    if (!isEmail && !isPhone) {
        throw new ApiError(400, "Invalid email or phone number format");
    }

    // Check if user exists based on userType and purpose
    let userExists = false;
    if (purpose === 'login' || purpose === 'password-reset') {
        if (userType === 'user') {
            userExists = await User.findOne({
                $or: [{ email: identifier }, { phone: identifier }]
            });
        } else if (userType === 'staff') {
            userExists = await Staff.findOne({
                $or: [{ email: identifier }, { phone: identifier }]
            });
        } else if (userType === 'admin') {
            userExists = await Admin.findOne({
                $or: [{ email: identifier }, { phone: identifier }]
            });
        }

        // For login/password-reset, user must exist
        if (!userExists) {
            throw new ApiError(404, `${userType} not found. Please sign up first.`);
        }
    }

    if (purpose === 'signup') {
        // For signup, user should not exist
        let existingUser = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
        if (existingUser) {
            throw new ApiError(400, "User already exists. Please login instead.");
        }
    }

    // Delete any existing OTP for this identifier
    await OTP.deleteMany({ identifier, purpose });

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Store OTP in database
    await OTP.create({
        identifier,
        otp: hashedOTP,
        type: isEmail ? 'email' : 'phone',
        purpose,
        userType,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    console.log(`✅ OTP generated for ${identifier}: ${otp}`);

    // Send OTP based on type
    try {
        if (isEmail) {
            await sendOTPEmail(identifier, otp, purpose);
        } else if (isPhone) {
            await sendOTPSMS(identifier, otp, purpose);
        }
    } catch (error) {
        console.error("Failed to send OTP:", error);
        throw new ApiError(500, "Failed to send OTP. Please try again.");
    }

    res.status(200).json(
        new ApiResponse(200, { 
            identifier, 
            type: isEmail ? 'email' : 'phone',
            purpose,
            expiresIn: 600 
        }, "OTP sent successfully")
    );
});

// Verify OTP
export const verifyOTP = asyncHandler(async (req, res) => {
    const { identifier, otp, purpose } = req.body;

    console.log('🔍 Verify OTP called:', { identifier, otp, purpose });

    if (!identifier || !otp || !purpose) {
        throw new ApiError(400, "Identifier, OTP and purpose are required");
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
        identifier,
        purpose,
        verified: false,
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Invalid or expired OTP. Please request a new OTP.");
    }

    // Check attempts limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    console.log(`✅ OTP verified for ${identifier}`);

    res.status(200).json(
        new ApiResponse(200, { 
            verified: true,
            identifier,
            purpose 
        }, "OTP verified successfully")
    );
});

// User Signup with OTP
// export const userSignupWithOTP = asyncHandler(async (req, res) => {
//     const { name, email, password, phone, street, city, state, pincode, otp } = req.body;

//     console.log('👤 User Signup called:', { name, email, phone });

//     if (!name || !email || !password || !phone || !otp) {
//         throw new ApiError(400, "All required fields must be filled including OTP");
//     }

//     // Verify OTP
//     const otpRecord = await OTP.findOne({
//         identifier: email,
//         purpose: 'signup',
//         expiresAt: { $gt: new Date() }
//     });

//     if (!otpRecord) {
//         throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
//     }

//     // Check attempt limit
//     if (otpRecord.attempts >= 5) {
//         await OTP.deleteOne({ _id: otpRecord._id });
//         throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
//     }

//     // Verify OTP
//     const isValid = await bcrypt.compare(otp, otpRecord.otp);
//     if (!isValid) {
//         otpRecord.attempts += 1;
//         await otpRecord.save();
//         throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
//     }

//     // Mark as verified
//     otpRecord.verified = true;
//     await otpRecord.save();

//     // Check if user already exists
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//         throw new ApiError(400, "Email or phone already registered");
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const newUser = await User.create({
//         name,
//         email,
//         password: hashedPassword,
//         phone,
//         address: { street, city, state, pincode },
//         isVerified: true
//     });

//     // Delete OTP record
//     await OTP.deleteOne({ _id: otpRecord._id });

//     // Generate tokens
//     const payload = { id: newUser._id, role: newUser.role };
//     const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
//     const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

//     res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     res.status(201).json(
//         new ApiResponse(201, {
//             accessToken,
//             user: {
//                 id: newUser._id,
//                 name: newUser.name,
//                 email: newUser.email,
//                 phone: newUser.phone,
//                 role: newUser.role
//             }
//         }, "User registered successfully")
//     );
// });

// User Signup with OTP
export const userSignupWithOTP = asyncHandler(async (req, res) => {
    // 🚀 NEW: Added workspaceCode to the destructured body
    const { name, email, password, phone, street, city, state, pincode, otp, workspaceCode } = req.body;

    console.log('👤 User Signup called:', { name, email, phone, workspaceCode });

    if (!name || !email || !password || !phone || !otp) {
        throw new ApiError(400, "All required fields must be filled including OTP");
    }

    // 🚀 NEW: Verify Workspace Code if the user provided one (since it's optional for users)
    let joinedWorkspaces = [];
    if (workspaceCode) {
        const admin = await Admin.findOne({ workspaceCode: workspaceCode.toUpperCase() });
        if (admin) {
            joinedWorkspaces.push(admin._id);
        } else {
            throw new ApiError(404, "Invalid Workspace Code provided. Please check the code or leave it blank.");
        }
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
        identifier: email,
        purpose: 'signup',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
    }

    // Check attempt limit
    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        throw new ApiError(400, "Email or phone already registered");
    }

    // 🔧 FIX: Removed manual password hashing
    // The User model's pre-save hook will handle password hashing automatically
    // This prevents the double hashing bug where password gets hashed twice

    // Create user (password will be hashed by pre-save hook)
    const newUser = await User.create({
        name,
        email,
        password: password,  // ← FIXED: Pass plain password, let model hash it
        phone,
        address: { street, city, state, pincode },
        isVerified: true,
        joinedWorkspaces // 🚀 NEW: Assign the workspace array to the user!
    });
    
    console.log('✅ User created with ID:', newUser._id, '(password auto-hashed by model)');

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const payload = { id: newUser._id, role: newUser.role };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json(
        new ApiResponse(201, {
            accessToken,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                joinedWorkspaces: newUser.joinedWorkspaces // Send this back so the frontend knows what they joined
            }
        }, "User registered successfully")
    );
});

// User Login with OTP
export const userLoginWithOTP = asyncHandler(async (req, res) => {
    const { identifier, otp } = req.body;

    console.log('🔐 User Login called:', { identifier });

    if (!identifier || !otp) {
        throw new ApiError(400, "Identifier and OTP are required");
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'login',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    // Find user
    const user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const payload = { id: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(
        new ApiResponse(200, {
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        }, "Login successful")
    );
});

// Staff Signup with OTP
// export const staffSignupWithOTP = asyncHandler(async (req, res) => {
//     const { name, email, password, phone, staffId, department, otp } = req.body;

//     console.log('👔 Staff Signup called:', { name, email, staffId });

//     if (!name || !email || !password || !phone || !staffId || !otp) {
//         throw new ApiError(400, "All required fields must be filled including OTP");
//     }

//     // Verify OTP
//     const otpRecord = await OTP.findOne({
//         identifier: email,
//         purpose: 'signup',
//         userType: 'staff',
//         expiresAt: { $gt: new Date() }
//     });

//     if (!otpRecord) {
//         throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
//     }

//     const isValid = await bcrypt.compare(otp, otpRecord.otp);
//     if (!isValid) {
//         otpRecord.attempts += 1;
//         await otpRecord.save();
//         throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
//     }

//     otpRecord.verified = true;
//     await otpRecord.save();

//     // Check if staff already exists
//     const existingStaff = await Staff.findOne({ $or: [{ email }, { staffId }] });
//     if (existingStaff) {
//         throw new ApiError(400, "Email or Staff ID already registered");
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create staff
//     const newStaff = await Staff.create({
//         name,
//         email,
//         password: hashedPassword,
//         phone,
//         staffId,
//         department,
//         isVerified: true
//     });

//     // Delete OTP record
//     await OTP.deleteOne({ _id: otpRecord._id });

//     // Generate tokens
//     const payload = { id: newStaff._id, role: 'staff' };
//     const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
//     const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

//     res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     res.status(201).json(
//         new ApiResponse(201, {
//             accessToken,
//             staff: {
//                 id: newStaff._id,
//                 name: newStaff.name,
//                 email: newStaff.email,
//                 staffId: newStaff.staffId,
//                 department: newStaff.department,
//                 role: 'staff'
//             }
//         }, "Staff registered successfully")
//     );
// });

// Staff Signup with OTP
export const staffSignupWithOTP = asyncHandler(async (req, res) => {
    // 🚀 NEW: Added workspaceCode to the destructured body
    const { name, email, password, phone, staffId, department, otp, workspaceCode } = req.body;

    console.log('👔 Staff Signup called:', { name, email, staffId, workspaceCode });

    if (!name || !email || !password || !phone || !staffId || !otp || !workspaceCode) {
        throw new ApiError(400, "All required fields must be filled, including OTP and Workspace Code");
    }

    // 🚀 NEW: Validate the Workspace Code before doing anything else
    const admin = await Admin.findOne({ workspaceCode: workspaceCode.toUpperCase() });
    if (!admin) {
        throw new ApiError(404, "Invalid Workspace Code. Please check with your administrator.");
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
        identifier: email,
        purpose: 'signup',
        userType: 'staff',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ $or: [{ email }, { staffId }] });
    if (existingStaff) {
        throw new ApiError(400, "Email or Staff ID already registered");
    }

    // 🔧 FIX: Removed manual password hashing
    // The Staff model's pre-save hook will handle password hashing automatically
    // This prevents the double hashing bug where password gets hashed twice

    // Create staff (password will be hashed by pre-save hook)
    const newStaff = await Staff.create({
        name,
        email,
        password: password,  // ← FIXED: Pass plain password, let model hash it
        phone,
        staffId,
        department,
        adminId: admin._id, // 🚀 NEW: Lock them to this specific Admin's workspace
        isApproved: false,  // 🚀 NEW: Admin must approve them before they can log in
        isVerified: true
    });
    
    console.log('✅ Staff created with ID:', newStaff._id, '(password auto-hashed by model)');

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const payload = { id: newStaff._id, role: 'staff' };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json(
        new ApiResponse(201, {
            accessToken,
            staff: {
                id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                staffId: newStaff.staffId,
                department: newStaff.department,
                adminId: newStaff.adminId,
                isApproved: newStaff.isApproved,
                role: 'staff'
            }
        }, "Staff registered successfully. Account is pending Admin approval.") // Updated message
    );
});

// Staff Login with OTP
// export const staffLoginWithOTP = asyncHandler(async (req, res) => {
//     const { identifier, otp } = req.body;

//     console.log('👔 Staff Login called:', { identifier });

//     if (!identifier || !otp) {
//         throw new ApiError(400, "Identifier and OTP are required");
//     }

//     const otpRecord = await OTP.findOne({
//         identifier,
//         purpose: 'login',
//         userType: 'staff',
//         expiresAt: { $gt: new Date() }
//     });

//     if (!otpRecord) {
//         throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
//     }

//     if (otpRecord.attempts >= 5) {
//         await OTP.deleteOne({ _id: otpRecord._id });
//         throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
//     }

//     const isValid = await bcrypt.compare(otp, otpRecord.otp);
//     if (!isValid) {
//         otpRecord.attempts += 1;
//         await otpRecord.save();
//         throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
//     }

//     otpRecord.verified = true;
//     await otpRecord.save();

//     const staff = await Staff.findOne({
//         $or: [{ email: identifier }, { phone: identifier }, { staffId: identifier }]
//     });

//     if (!staff) {
//         throw new ApiError(404, "Staff not found");
//     }

//     await OTP.deleteOne({ _id: otpRecord._id });

//     const payload = { id: staff._id, role: 'staff' };
//     const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
//     const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

//     res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     res.status(200).json(
//         new ApiResponse(200, {
//             accessToken,
//             staff: {
//                 id: staff._id,
//                 name: staff.name,
//                 email: staff.email,
//                 staffId: staff.staffId,
//                 department: staff.department,
//                 role: 'staff'
//             }
//         }, "Staff login successful")
//     );
// });

// Staff Login with OTP
export const staffLoginWithOTP = asyncHandler(async (req, res) => {
    // 🚀 NEW: Added workspaceCode requirement
    const { identifier, otp, workspaceCode } = req.body;

    console.log('👔 Staff Login called:', { identifier, workspaceCode });

    if (!identifier || !otp || !workspaceCode) {
        throw new ApiError(400, "Identifier, OTP, and Workspace Code are required");
    }

    // 🚀 NEW: Verify the workspace exists first
    const admin = await Admin.findOne({ workspaceCode: workspaceCode.toUpperCase() });
    if (!admin) {
        throw new ApiError(404, "Invalid Workspace Code");
    }

    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'login',
        userType: 'staff',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    // 🚀 NEW: Find staff BUT ensure they belong to the provided workspace
    const staff = await Staff.findOne({
        $or: [{ email: identifier }, { phone: identifier }, { staffId: identifier }],
        adminId: admin._id // Security check
    });

    if (!staff) {
        throw new ApiError(404, "Staff member not found in this workspace");
    }

    // 🚀 NEW: Block login if Admin hasn't approved them yet
    if (!staff.isApproved) {
        throw new ApiError(403, "Login Denied: Your account is still pending Admin approval.");
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const payload = { id: staff._id, role: 'staff', workspaceCode: admin.workspaceCode };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(
        new ApiResponse(200, {
            accessToken,
            staff: {
                id: staff._id,
                name: staff.name,
                email: staff.email,
                staffId: staff.staffId,
                department: staff.department,
                workspaceCode: admin.workspaceCode,
                role: 'staff'
            }
        }, "Staff login successful")
    );
});

// Admin Signup with OTP
export const adminSignupWithOTP = asyncHandler(async (req, res) => {
    // 🚀 Uses organizationName instead of workspaceName
    const { organizationName, name, email, password, phone, otp } = req.body;

    console.log("🏢 New Workspace creation attempt with OTP:", { email, organizationName });

    if (!organizationName || !name || !email || !password || !otp) {
        throw new ApiError(400, "Organization name, Admin name, email, password, and OTP are required");
    }

    // --- 1. VERIFY OTP ---
    const otpRecord = await OTP.findOne({
        identifier: email,
        purpose: 'signup',
        userType: 'admin',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    // --- 2. CHECK EXISTING ADMIN ---
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        throw new ApiError(400, "Email is already registered");
    }

    // --- 3. CREATE ADMIN ---
    // ⚠️ IMPORTANT: If your Admin model has a pre-save hook that hashes the password automatically 
    // (like your User/Staff models), change `password: hashedPassword` to just `password: password`
    // to avoid the double-hashing bug!
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
        organizationName,
        name,
        email,
        password: hashedPassword, 
        phone,
        isVerified: true // Mark as verified since OTP succeeded
    });

    await newAdmin.save();
    console.log(`✅ Workspace created! Code: ${newAdmin.workspaceCode}`);

    // --- 4. AUTO-PROVISION DEFAULT DEPARTMENT ---
    try {
        const defaultDept = new Department({
            name: 'Other',
            description: 'Default bucket for general or unassigned issues.',
            adminId: newAdmin._id,
            workspaceCode: newAdmin.workspaceCode
        });
        await defaultDept.save();
        console.log(`✅ Default 'Other' department created for workspace ${newAdmin.workspaceCode}`);
    } catch (deptError) {
        console.error("⚠️ Failed to create default department:", deptError);
        // We don't throw an error here so the signup still succeeds even if the department fails
    }

    // Delete OTP record now that it's fully used
    await OTP.deleteOne({ _id: otpRecord._id });

    // --- 5. GENERATE LOGIN TOKENS ---
    const payload = { 
        id: newAdmin._id, 
        role: newAdmin.role || 'admin', 
        workspaceCode: newAdmin.workspaceCode 
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // --- 6. SEND RESPONSE ---
    res.status(201).json(
        new ApiResponse(201, {
            accessToken,
            admin: {
                id: newAdmin._id,
                organizationName: newAdmin.organizationName,
                name: newAdmin.name,
                email: newAdmin.email,
                workspaceCode: newAdmin.workspaceCode 
            }
        }, "Workspace created successfully")
    );
});

// Admin Login with OTP
export const adminLoginWithOTP = asyncHandler(async (req, res) => {
    const { identifier, otp } = req.body;

    console.log('👑 Admin Login called:', { identifier });

    if (!identifier || !otp) {
        throw new ApiError(400, "Identifier and OTP are required");
    }

    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'login',
        userType: 'admin',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const admin = await Admin.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const payload = { id: admin._id, role: admin.role };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(
        new ApiResponse(200, {
            accessToken,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        }, "Admin login successful")
    );
});

// Password Reset - Request OTP
export const requestPasswordResetOTP = asyncHandler(async (req, res) => {
    const { identifier, userType = 'user' } = req.body;

    console.log('🔑 Password Reset Request:', { identifier, userType });

    if (!identifier) {
        throw new ApiError(400, "Email or phone number is required");
    }

    let user;
    if (userType === 'user') {
        user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    } else if (userType === 'staff') {
        user = await Staff.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    } else if (userType === 'admin') {
        user = await Admin.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete existing OTPs
    await OTP.deleteMany({ identifier, purpose: 'password-reset' });

    // Generate and send OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.create({
        identifier,
        otp: hashedOTP,
        type: user.email === identifier ? 'email' : 'phone',
        purpose: 'password-reset',
        userType,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP
    if (user.email === identifier) {
        await sendOTPEmail(identifier, otp, 'password-reset');
    } else {
        await sendOTPSMS(identifier, otp, 'password-reset');
    }

    res.status(200).json(
        new ApiResponse(200, { identifier }, "Password reset OTP sent successfully")
    );
});

// Password Reset - Verify OTP and Reset Password
export const resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { identifier, otp, newPassword, userType = 'user' } = req.body;

    console.log('🔄 Password Reset Verify:', { identifier, userType });

    if (!identifier || !otp || !newPassword) {
        throw new ApiError(400, "All fields are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'password-reset',
        userType,
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, "Invalid OTP");
    }

    // Find and update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let user;

    if (userType === 'user') {
        user = await User.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone: identifier }] },
            { password: hashedPassword },
            { new: true }
        );
    } else if (userType === 'staff') {
        user = await Staff.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone: identifier }] },
            { password: hashedPassword },
            { new: true }
        );
    } else if (userType === 'admin') {
        user = await Admin.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone: identifier }] },
            { password: hashedPassword },
            { new: true }
        );
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
});

// Resend OTP
export const resendOTP = asyncHandler(async (req, res) => {
    const { identifier, purpose = 'login', userType = 'user' } = req.body;

    console.log('🔄 Resend OTP:', { identifier, purpose, userType });

    if (!identifier) {
        throw new ApiError(400, "Identifier is required");
    }

    // Check if previous OTP was sent recently (prevent spam)
    const recentOTP = await OTP.findOne({
        identifier,
        purpose,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Within last minute
    });

    if (recentOTP) {
        throw new ApiError(429, "Please wait 60 seconds before requesting a new OTP");
    }

    // Delete existing OTPs
    await OTP.deleteMany({ identifier, purpose });

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    await OTP.create({
        identifier,
        otp: hashedOTP,
        type: isEmail ? 'email' : 'phone',
        purpose,
        userType,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP
    if (isEmail) {
        await sendOTPEmail(identifier, otp, purpose);
    } else {
        await sendOTPSMS(identifier, otp, purpose);
    }

    res.status(200).json(
        new ApiResponse(200, { identifier }, "OTP resent successfully")
    );
});

// Debug OTP endpoint
export const debugOTP = asyncHandler(async (req, res) => {
    const { identifier } = req.query;
    
    const otps = await OTP.find({ identifier });
    
    res.status(200).json(
        new ApiResponse(200, {
            count: otps.length,
            otps: otps.map(otp => ({
                identifier: otp.identifier,
                purpose: otp.purpose,
                userType: otp.userType,
                verified: otp.verified,
                attempts: otp.attempts,
                expiresAt: otp.expiresAt,
                createdAt: otp.createdAt,
                isExpired: otp.expiresAt < new Date()
            }))
        }, "OTP debug information")
    );
});
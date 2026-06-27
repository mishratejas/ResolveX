import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";
import { issueAuthTokens } from "../utils/authTokens.js";
import { verifyOTPRecord } from "../utils/otpVerification.js";
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
export const requestOTP = async (req, res) => {
  try {
    const { identifier, type = 'email', purpose, userType = 'user' } = req.body;

    console.log('Request OTP called:', { identifier, type, purpose, userType });

    if (!identifier) {
        return res.status(400).json({ success: false, message: "Email or phone number is required" });
    }

    // Validate identifier format
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^[0-9]{10}$/.test(identifier);

    if (!isEmail && !isPhone) {
        return res.status(400).json({ success: false, message: "Invalid email or phone number format" });
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
            return res.status(404).json({ success: false, message: `${userType} not found. Please sign up first.` });
        }
    }

    if (purpose === 'signup') {
        // For signup, user should not exist
        let existingUser = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists. Please login instead." });
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

    console.log(`OTP generated for ${identifier}: ${otp}`);

    // Send OTP based on type
    try {
        if (isEmail) {
            await sendOTPEmail(identifier, otp, purpose);
        } else if (isPhone) {
            await sendOTPSMS(identifier, otp, purpose);
        }
    } catch (error) {
        console.error("Failed to send OTP:", error);
        return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
    }

    res.status(200).json(
        { success: true, message: "OTP sent successfully", data: { 
            identifier, 
            type: isEmail ? 'email' : 'phone',
            purpose,
            expiresIn: 600 
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { identifier, otp, purpose } = req.body;

    console.log('Verify OTP called:', { identifier, otp, purpose });

    if (!identifier || !otp || !purpose) {
        return res.status(400).json({ success: false, message: "Identifier, OTP and purpose are required" });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
        identifier,
        purpose,
        verified: false,
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new OTP." });
    }

    // Check attempts limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({ success: false, message: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return res.status(400).json({ success: false, message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.` });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    console.log(`OTP verified for ${identifier}`);

    res.status(200).json(
        { success: true, message: "OTP verified successfully", data: { 
            verified: true,
            identifier,
            purpose 
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// User Signup with OTP
export const userSignupWithOTP = async (req, res) => {
  try {
    // Added workspaceCode to the destructured body
    const { name, email, password, phone, street, city, state, pincode, otp, workspaceCode } = req.body;

    console.log('User Signup called:', { name, email, phone, workspaceCode });

    if (!name || !email || !password || !phone || !otp) {
        return res.status(400).json({ success: false, message: "All required fields must be filled including OTP" });
    }

    // Verify Workspace Code if the user provided one (since it's optional for users)
    let joinedWorkspaces = [];
    if (workspaceCode) {
        const admin = await Admin.findOne({ workspaceCode: workspaceCode.toUpperCase() });
        if (admin) {
            joinedWorkspaces.push(admin._id);
        } else {
            return res.status(404).json({ success: false, message: "Invalid Workspace Code provided. Please check the code or leave it blank." });
        }
    }

    // Verify OTP (shared helper: lookup, attempt-limit, compare, mark verified)
    const otpRecord = await verifyOTPRecord({ identifier: email, otp, purpose: 'signup', userType: 'user' });

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Email or phone already registered" });
    }

    // The User model's pre-save hook will handle password hashing automatically
    // This prevents the double hashing bug where password gets hashed twice

    // Create user (password will be hashed by pre-save hook)
    const newUser = await User.create({
        name,
        email,
        password: password,  // Pass plain password, let model hash it
        phone,
        address: { street, city, state, pincode },
        isVerified: true,
        joinedWorkspaces // Assign the workspace array to the user!
    });
    
    console.log('User created with ID:', newUser._id, '(password auto-hashed by model)');

    // Delete OTP record now that signup fully succeeded
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens + set refresh cookie
    const accessToken = issueAuthTokens(res, { id: newUser._id, role: newUser.role });

    res.status(201).json(
        { success: true, message: "User registered successfully", data: {
            accessToken,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                joinedWorkspaces: newUser.joinedWorkspaces // Send this back so the frontend knows what they joined
            }
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Staff Signup with OTP
export const staffSignupWithOTP = async (req, res) => {
  try {
    // Added workspaceCode to the destructured body
    const { name, email, password, phone, staffId, department, otp, workspaceCode } = req.body;

    console.log('Staff Signup called:', { name, email, staffId, workspaceCode });

    if (!name || !email || !password || !phone || !staffId || !otp || !workspaceCode) {
        return res.status(400).json({ success: false, message: "All required fields must be filled, including OTP and Workspace Code" });
    }

    // Validate the Workspace Code before doing anything else
    const admin = await Admin.findOne({ workspaceCode: workspaceCode.toUpperCase() });
    if (!admin) {
        return res.status(404).json({ success: false, message: "Invalid Workspace Code. Please check with your administrator." });
    }

    // Verify OTP (shared helper)
    const otpRecord = await verifyOTPRecord({ identifier: email, otp, purpose: 'signup', userType: 'staff' });

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ $or: [{ email }, { staffId }] });
    if (existingStaff) {
        return res.status(400).json({ success: false, message: "Email or Staff ID already registered" });
    }

    // The Staff model's pre-save hook will handle password hashing automatically
    // This prevents the double hashing bug where password gets hashed twice

    // Create staff (password will be hashed by pre-save hook)
    const newStaff = await Staff.create({
        name,
        email,
        password: password,  //Pass plain password, let model hash it
        phone,
        staffId,
        department,
        adminId: admin._id, // Lock them to this specific Admin's workspace
        isApproved: false,  //  Admin must approve them before they can log in
        isVerified: true
    });
    
    console.log('Staff created with ID:', newStaff._id, '(password auto-hashed by model)');

    // Delete OTP record now that signup fully succeeded
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens + set refresh cookie
    const accessToken = issueAuthTokens(res, { id: newStaff._id, role: 'staff' });

    res.status(201).json(
        { success: true, message: "Staff registered successfully. Account is pending Admin approval.", data: {
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
        } } // Updated message
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};



export const adminSignupWithOTP = async (req, res) => {
  try {
    //   Uses organizationName instead of workspaceName
    const { organizationName, name, email, password, phone, otp } = req.body;

    console.log("New Workspace creation attempt with OTP:", { email, organizationName });

    if (!organizationName || !name || !email || !password || !otp) {
        return res.status(400).json({ success: false, message: "Organization name, Admin name, email, password, and OTP are required" });
    }

    // --- 1. VERIFY OTP (shared helper) ---
    const otpRecord = await verifyOTPRecord({ identifier: email, otp, purpose: 'signup', userType: 'admin' });

    // --- 2. CHECK EXISTING ADMIN ---
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // --- 3. CREATE ADMIN ---
    // Password hashing is handled by the Admin model's pre('save') hook now
    // (the same way User/Staff signup already works), so we pass the plain
    // password straight through instead of hashing it here.
    const newAdmin = new Admin({
        organizationName,
        name,
        email,
        password,
        phone,
        isVerified: true // Mark as verified since OTP succeeded
    });

    await newAdmin.save();
    console.log(`Workspace created! Code: ${newAdmin.workspaceCode}`);

    // --- 4. AUTO-PROVISION DEFAULT DEPARTMENT ---
    try {
        const defaultDept = new Department({
            name: 'Other',
            description: 'Default bucket for general or unassigned issues.',
            adminId: newAdmin._id,
            workspaceCode: newAdmin.workspaceCode
        });
        await defaultDept.save();
        console.log(`Default 'Other' department created for workspace ${newAdmin.workspaceCode}`);
    } catch (deptError) {
        console.error("Failed to create default department:", deptError);
        // We don't throw an error here so the signup still succeeds even if the department fails
    }

    // Delete OTP record now that it's fully used
    await OTP.deleteOne({ _id: otpRecord._id });

    // --- 5. GENERATE LOGIN TOKENS ---
    const accessToken = issueAuthTokens(res, {
        id: newAdmin._id,
        role: newAdmin.role || 'admin',
        workspaceCode: newAdmin.workspaceCode
    });

    // --- 6. SEND RESPONSE ---
    res.status(201).json(
        { success: true, message: "Workspace created successfully", data: {
            accessToken,
            admin: {
                id: newAdmin._id,
                organizationName: newAdmin.organizationName,
                name: newAdmin.name,
                email: newAdmin.email,
                workspaceCode: newAdmin.workspaceCode 
            }
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};


export const requestPasswordResetOTP = async (req, res) => {
  try {
    const { identifier, userType = 'user' } = req.body;

    console.log('Password Reset Request:', { identifier, userType });

    if (!identifier) {
        return res.status(400).json({ success: false, message: "Email or phone number is required" });
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
        return res.status(404).json({ success: false, message: "User not found" });
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
        { success: true, message: "Password reset OTP sent successfully", data: { identifier } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Password Reset - Verify OTP and Reset Password
export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { identifier, otp, newPassword, userType = 'user' } = req.body;

    console.log('Password Reset Verify:', { identifier, userType });

    if (!identifier || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // Verify OTP (shared helper)
    const otpRecord = await verifyOTPRecord({ identifier, otp, purpose: 'password-reset', userType });

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
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json(
        { success: true, message: "Password reset successfully", data: {} }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { identifier, purpose = 'login', userType = 'user' } = req.body;

    console.log('Resend OTP:', { identifier, purpose, userType });

    if (!identifier) {
        return res.status(400).json({ success: false, message: "Identifier is required" });
    }

    // Check if previous OTP was sent recently (prevent spam)
    const recentOTP = await OTP.findOne({
        identifier,
        purpose,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Within last minute
    });

    if (recentOTP) {
        return res.status(429).json({ success: false, message: "Please wait 60 seconds before requesting a new OTP" });
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
        { success: true, message: "OTP resent successfully", data: { identifier } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
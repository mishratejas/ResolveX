import mongoose from "mongoose";
import Staff from "../models/Staff.models.js";
import Department from "../models/Department.model.js";
import bcrypt from "bcryptjs";
import OTP from "../models/otp.model.js";
import jwt from "jsonwebtoken";

export const staffRegister = async (req, res) => {
    try {
console.log('========== STAFF REGISTRATION STARTED ==========');
    console.log('📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    const { name, email, password, phone, staffId, otp, departmentId } = req.body;
    
    console.log('🔍 Department value from request:', departmentId);
    console.log('🔍 Type of department value:', typeof departmentId);
    
    if (departmentId && typeof departmentId === 'string') {
      console.log('🔍 Is it a valid ObjectId?', mongoose.Types.ObjectId.isValid(departmentId));
    }
        // 2. Update validation to require the OTP
        if (!name || !email || !password || !staffId || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields, including the OTP."
            });
        }

        // --- OTP Verification Logic ---
        const otpRecord = await OTP.findOne({
            identifier: email,
            purpose: 'signup',
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP, or it has expired. Please request a new one."
            });
        }
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({
                success: false,
                message: "Too many failed OTP attempts. Please request a new one."
            });
        }
        const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValidOTP) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. You have ${5 - otpRecord.attempts} attempts remaining.`
            });
        }
        // --- End of OTP Logic ---

        const existingStaff = await Staff.findOne({ $or: [{ email }, { staffId }] });
        if (existingStaff) {
            return res.status(400).json({
                success: false,
                message: "Email or Staff ID already registered."
            });
        }

        // --- DEPARTMENT VALIDATION ---
        let departmentObjectId = null;
        if (departmentId) {
            console.log('Validating department ID:', departmentId);
            
            // Check if it's a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department ID format"
                });
            }
            
            // Check if department exists
            const department = await Department.findById(departmentId);
            console.log('Found department:', department);
            
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department selected. Please choose from the list."
                });
            }
            
            // Check if department is active
            if (!department.isActive) {
                return res.status(400).json({
                    success: false,
                    message: "This department is currently inactive. Please select another department."
                });
            }
            
            departmentObjectId = departmentId;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newStaff = new Staff({
            name,
            email,
            password: hashedPassword,
            phone,
            staffId,
            department: departmentObjectId, // Add department to staff
            role: "staff"
        });
        
        console.log('Creating staff with data:', {
            name, email, staffId, department: departmentObjectId
        });
        
        await newStaff.save();

        // Delete the used OTP record after staff is created
        await OTP.deleteOne({ _id: otpRecord._id });
        
        // --- Auto-Login Logic ---
        const payload = { 
            id: newStaff._id,
            role: newStaff.role || "staff"
        };
        
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });
        
        // Populate department in response
        await newStaff.populate('department', 'name category');
        
        res.status(201).json({
            success: true,
            message: "Staff registered and logged in successfully!", 
            accessToken,
            staff: {
                _id: newStaff._id,
                name: newStaff.name,
                role: newStaff.role,
                staffId: newStaff.staffId,
                email: newStaff.email,
                department: newStaff.department,
                phone: newStaff.phone
            }
        });
        
    } catch (err) {
        console.error("Staff registration error:", err);
        
        // Handle specific MongoDB errors
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID format. Please select a valid department from the dropdown."
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Server Error during staff registration"
        });
    }
};

export const staffLogin = async (req, res) => {
    try {
        const { staffIdOrEmail, password } = req.body; 
        
        if (!staffIdOrEmail || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Staff ID/Email and password are required" 
            });
        }
        
        const staff = await Staff.findOne({
            $or: [{ email: staffIdOrEmail }, { staffId: staffIdOrEmail }], 
        }).populate('department', 'name category'); // Populate department info
        
        if (!staff) {
            return res.status(404).json({ 
                success: false,
                message: "Staff not found or Invalid Credentials" 
            });
        }
        
        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false, 
                message: "Invalid Credentials" 
            });
        } 
        
        const payload = { 
            id: staff._id,
            role: staff.role || "staff"
        };
        
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
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
                phone: staff.phone
            }
        });
        
    } catch (err) {
        console.error("Staff Login Error:", err);
        res.status(500).json({ 
            success: false,
            message: "Server Error during staff login." 
        });
    }
};
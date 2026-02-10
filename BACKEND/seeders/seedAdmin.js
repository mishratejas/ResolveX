import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../src/models/Admin.models.js";

dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email: "admin@resolvex.com" });
        
        if (existingAdmin) {
            console.log("✅ Admin already exists");
            console.log("Admin email:", existingAdmin.email);
            console.log("To reset password, delete this admin and run script again");
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("pass123", salt);

        // Create admin
        const admin = new Admin({
            name: "System Administrator",
            email: "admin@resolvex.com",
            phone: "1234567890",
            password: hashedPassword,
            role: "superadmin",
            permissions: {
                canAssign: true,
                canResolve: true,
                canDelete: true
            }
        });

        await admin.save();
        
        console.log("✅ Default admin created successfully!");
        console.log("📋 Admin Credentials:");
        console.log("Email: admin@resolvex.com");
        console.log("Password: pass123");
        console.log("Role: superadmin");
        
        process.exit(0);
        
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
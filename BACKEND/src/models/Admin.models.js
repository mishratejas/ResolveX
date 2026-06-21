import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        trim: true
    },
    workspaceCode: {
        type: String,
        unique: true,
        uppercase: true,
        index: true // Indexed for fast lookups when users/staff join
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        match: /^[0-9]{10}$/
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "superadmin"],
        default: "admin"
    },
    profileImage: {
        type: String
    },
    permissions: {
        canAssign: { type: Boolean, default: true },
        canResolve: { type: Boolean, default: true },
        canDelete: { type: Boolean, default: false }
    }
}, { timestamps: true }); 

// Auto-generate a 6-character alphanumeric workspace code before saving a new Admin
adminSchema.pre('save', function(next) {
    if (this.isNew && !this.workspaceCode) {
        // Generates a random 6-character hex string, converts to uppercase
        this.workspaceCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    next();
});

// Hash password before saving (same pattern as User/Staff models)
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Admin", adminSchema);
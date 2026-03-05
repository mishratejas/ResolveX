// import mongoose from "mongoose";

// const departmentSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     description: {
//         type: String
//     },
//     head: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Staff"
//     },
//     contactEmail: {
//         type: String,
//         lowercase: true
//     },
//     contactPhone: {
//         type: String,
//         match: /^[0-9]{10}$/
//     },
//     category: {
//         type: String,
//         enum: ["infrastructure", "utilities", "public-safety", "administrative", "health", "education", "other"],
//         required: true
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// export default mongoose.model("Department", departmentSchema);

import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
        index: true // Crucial for fetching departments by workspace code quickly
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff"
    },
    contactEmail: {
        type: String,
        lowercase: true
    },
    contactPhone: {
        type: String,
        match: /^[0-9]{10}$/
    },
    category: {
        type: String,
        enum: ["infrastructure", "utilities", "public-safety", "administrative", "health", "education", "other"],
        default: "other"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// COMPOUND INDEX: Ensures department names are only unique WITHIN a specific admin's workspace
departmentSchema.index({ adminId: 1, name: 1 }, { unique: true });

export default mongoose.model("Department", departmentSchema);
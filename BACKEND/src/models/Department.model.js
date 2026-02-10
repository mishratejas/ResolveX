import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
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
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Department", departmentSchema);
// import mongoose from "mongoose"

// const adminSchema=new mongoose.Schema({
//     name:{
//         type:String,
//         required:true
//     },
//     email:{
//         type:String,
//         required:true,
//         unique:true,
//         lowercase:true
//     },
//     phone:{
//         type:String,
//         match:/^[0-9]{10}$/
//     },
//     password:{
//         type:String,
//         required:true
//     },
//     department:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:"Department"
//     },
//     role:{
//         type:String,
//         enum:["admin","superadmin"],
//         default:"admin"
//     },
//     profileImage:{
//         type:String
//     },
//     permissions:{
//         canAssign:{
//             type:Boolean,
//             default:false
//         },
//         canResolve:{
//             type:Boolean,
//             default:true
//         },
//         canDelete:{
//             type:Boolean,
//             default:false
//         }
//     },
//     createdAt:{
//         type:Date,
//         default:Date.now
//     }
// });

// export default mongoose.model("Admin",adminSchema);

import mongoose from "mongoose";
import crypto from "crypto";

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
}, { timestamps: true }); // Switched to built-in timestamps

// Auto-generate a 6-character alphanumeric workspace code before saving a new Admin
adminSchema.pre('save', function(next) {
    if (this.isNew && !this.workspaceCode) {
        // Generates a random 6-character hex string, converts to uppercase
        this.workspaceCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    next();
});

export default mongoose.model("Admin", adminSchema);
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const userSchema=new mongoose.Schema({
//     name:{
//         type:String,
//         required:true,
//         trim:true
//     },
//     email:{
//         type:String,
//         required:true,
//         unique:true,
//         lowercase:true
//     },
//     password:{
//         type:String,
//         required:true
//     },
//     phone:{
//         type:String,
//         required:true,
//         match:/^[0-9]{10}$/
//     },
//     address:{
//         street:String,
//         city:String,
//         state:String,
//         pincode:String
//     },
//     role:{
//         type:String,
//         enum:["user","staff","admin"],
//         default: "user"
//     },
//     profileImage:{
//         type:String,
//         default:""  //cloudinary ka url
//     },
//     isVerified:{
//         type:Boolean,
//         default:false   //email/otp verification
//     },
//     createdAt:{
//         type:Date,
//         default:Date.now
//     }
// });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
    
//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// // Method to compare passwords
// userSchema.methods.comparePassword = async function(candidatePassword) {
//     return await bcrypt.compare(candidatePassword, this.password);
// };

// export default mongoose.model("User",userSchema);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    role: {
        type: String,
        default: "user" // Simplified since Staff and Admin have their own models now
    },
    profileImage: {
        type: String,
        default: "" 
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // 🚀 NEW: Multi-Tenant Connection! 
    // This allows a user to be part of multiple Admin workspaces.
    joinedWorkspaces: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
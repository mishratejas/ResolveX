// import mongoose from "mongoose";

// const staffSchema= new mongoose.Schema({
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
//         staffId: {
//         type: String,
//         required: true, 
//         unique: true,
//         trim: true
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
//     profileImage:{
//         type:String
//     },
//     isActive:{
//         type:Boolean,
//         default:true
//     },
//     createdAt:{
//         type:Date,
//         default:Date.now
//     }
// });

// // Hash password before saving
// staffSchema.pre('save', async function(next) {
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
// staffSchema.methods.comparePassword = async function(candidatePassword) {
//     return await bcrypt.compare(candidatePassword, this.password);
// };

// export default mongoose.model("Staff",staffSchema);

import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Added missing import!

const staffSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false // Security measure: Admin must approve them before they can login
    },
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
    staffId: {
        type: String,
        required: true, 
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        match: /^[0-9]{10}$/
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true // Making this required so load-balancer always knows where they belong
    },
    profileImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Hash password before saving
staffSchema.pre('save', async function(next) {
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
staffSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Staff", staffSchema);
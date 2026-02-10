import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true,
        match:/^[0-9]{10}$/
    },
    address:{
        street:String,
        city:String,
        state:String,
        pincode:String
    },
    role:{
        type:String,
        enum:["user","staff","admin"],
        default: "user"
    },
    profileImage:{
        type:String,
        default:""  //cloudinary ka url
    },
    isVerified:{
        type:Boolean,
        default:false   //email/otp verification
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

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

export default mongoose.model("User",userSchema);
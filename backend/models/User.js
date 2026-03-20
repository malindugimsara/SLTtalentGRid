import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true // Eka email eken eka account ekai hadanna puluwan
    },
    password: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
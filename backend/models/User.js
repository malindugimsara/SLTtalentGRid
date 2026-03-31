import mongoose from "mongoose";

// Define the schema for the user
const userSchema = new mongoose.Schema ({
    email : {
        type: String,
        required: true,
        unique: true    
    },
    name :{
        type: String,
        required: true
    },
    address : {
        type: String,
        required: true,
        default: "Not given"
    },
    role : {
        type : String,
        require : true,
        default: "user",
    },
    password : {
        type: String,
        required: true
    },
    phoneNumber : {
        type: String,
        required: true,
        default: "Not given"
    },
    isDisable : {
        type: Boolean,
        default: false
    },
    isEmailVerified : {
        type: Boolean,
        default: false
    }
}) 

// Create a model from the schema
const User = mongoose.model("user", userSchema) 
export default User;
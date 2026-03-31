import User from "../models/User.js";
import bcrypt from "bcrypt" 
import jwd from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
import e from "express";
import nodemailer from "nodemailer";
import { OTP } from "../models/otp.js";
dotenv.config();

const transport = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
// This function saves a new user to the database
export function saveUser(req, res) {
    // if (req.body.role == "admin") {
    //     if (req.user == null) {
    //         return res.status(403).json({
    //             message: "Please login as an admin to create a new admin user"
    //         });
    //         return;
    //     }
    //     if (req.user.role != "admin") {
    //         return res.status(403).json({
    //             message: "You are not authorized to create a new admin user"
    //         });
    //         return;
    //     }
    // }
    // const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    if (!req.body.password) {
        return res.status(400).json({
            message: "Password is required"
        });
    }

    if (req.body.role == "admin") {
        if (req.user == null) {
            return res.status(403).json({
                message: "Please login as an admin to create a new admin user"
            });
        }
        if (req.user.role != "admin") {
            return res.status(403).json({
                message: "You are not authorized to create a new admin user"
            });
        }
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user =new User({
        email: req.body.email,
        name: req.body.name,
        address: req.body.address,
        password: hashedPassword,
        role: req.body.role || "user", // Default role is 'user'
        phoneNumber: req.body.phoneNumber || "Not given", // Default phoneNumber to "Not given"
        isDisable: req.body.isDisable || false, // Default isDisable to false
        isEmailVerified: req.body.isEmailVerified || false // Default isEmailVerified to false
    })


    user.save().then(()=> {
        res.json({
            message: "User created successfully"
        })
    }).catch((err) => {
        console.error("Error creating user:", err);
        res.status(500).json({
            message: "Error creating user",
            error: err.message
        });
    })
}

// This function logs in a user by checking their email and password
export function loginUser(req, res){
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({
        email : email
    }).then((user) => {
        if (user == null) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        else {
            const isPasswordValid = bcrypt.compareSync(password, user.password);
            if (isPasswordValid) {
                // Generate a JWT token
                const userData ={
                    email: user.email,
                    name: user.name,
                    address: user.address,
                    role: user.role,
                    phoneNumber: user.phoneNumber,
                    isDisable: user.isDisable,
                    isEmailVerified: user.isEmailVerified
                }
                const token = jwd.sign(userData,process.env.JWT_KEY,{
                    expiresIn: "48hrs" // Token
                })
                res.json({
                    message: "Login successfully",
                    token: token,
                    user: userData
                })

            } else {
                res.status(401).json({
                    message: "Invalid password"
                });
            }
        }
    })
}

// export async function googleLogin(req, res) {
//     const accessToken = req.body.accessToken;
//     try {
//         const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
//             headers: {
//                 Authorization: `Bearer ${accessToken}`
//             }
//         });
//         console.log(response);
//         const user = await User.findOne({ email: response.data.email });
//         if (user == null) {
//             const newUser = new User({
//                 email: response.data.email,
//                 name: response.data.given_name,
//                 address: response.data.family_name,
//                 password: accessToken,
//                 isEmailVerified : true
//             });
//             await newUser.save();
            
//             const userData = {
//                 email: response.data.email,
//                 name: response.data.given_name,
//                 address: response.data.family_name,
//                 role: "user",
//                 phoneNumber: "Not given",
//                 isDisable: false,
//                 isEmailVerified: true
//             }

//             const token = jwd.sign(userData,process.env.JWT_KEY,{
//                 expiresIn: "48hrs" // Token
//             })
//             res.json({
//                 message: "Login successfully",
//                 token: token,
//                 user: userData
//             })
//         }
//         else {
//             const userData = {
//                 email: user.email,
//                 name: user.name,
//                 address: user.address,
//                 role: user.role,
//                 phoneNumber: user.phoneNumber,
//                 isDisable: user.isDisable,
//                 isEmailVerified: user.isEmailVerified
//             }

//             const token = jwd.sign(userData,process.env.JWT_KEY,{
//                 expiresIn: "48hrs" // Token
//             })
//             res.json({
//                 message: "Login successfully",
//                 token: token,
//                 user: userData
//             })
//         }
//     }
//     catch (error) {
//         console.error("Error during Google login:", error);
//         res.status(500).json({
//             message: "Error during Google login",
//             error: error.message
//         });
//     }
// }

export function getCurrentUser(req, res) {
    if (req.user == null) {
        res.status(403).json({
            message: "You need to login first"
        });
        return;
    }
    res.json({
        user: req.user});
}   
export function sendOTP(req, res){
    const email = req.body.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const message ={
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`
    }

    const newOTP = new OTP({
        email: email,
        otp: otp
    });
    newOTP.save().then(() => {
        console.log("OTP saved to database");
    }).catch((err) => {
        console.error("Error saving OTP to database:", err);
    });

    transport.sendMail(message, (err, info) => {
        if (err) {
            console.error("Error sending OTP email:", err);
            res.status(500).json({
                message: "Error sending OTP email",
                error: err.message
            });
        }
        else {
            console.log("OTP email sent:", info.response);
            res.json({
                message: "OTP sent successfully",
                otp: otp // In a real application, do not send the OTP back in the response
            });
        }
    })

} 

export async function changePassword(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const otp = req.body.otp; 

    try{
        const lastOTPData= await OTP.findOne({
            email: email,
        }).sort({ createdAt: -1})

        if(lastOTPData==null){
            res.status(404).json({
                message: "OTP not found for this email"
            });
            return;
        }
        if(lastOTPData.otp != otp){
            res.status(403).json({
                message: "Invalid OTP"
            });
            return;
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        await User.updateOne({
            email: email
        },{
            password: hashedPassword
        });
        await OTP.deleteMany({
            email: email
        });
        res.json({
            message: "Password changed successfully"
        });

    }catch(err){
        console.error("Error changing password:", err);
        res.status(500).json({
            message: "Error changing password",
            error: err.message
        });
    }
}
export function deleteUser(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to login first" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not authorized to delete a user" });
  }

  User.findByIdAndDelete(req.params.userID)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error deleting user",
        error: err.message,
      });
    });
}

export function updateUser(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to login first",
    });
    return;
  }

  // Assuming you're using MongoDB with Mongoose and User model
  User.findByIdAndUpdate(req.params.userID, req.body, { new: true })
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (!/^\d{10}$/.test(req.body.phoneNumber)) {
          return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
      }
      
      res.json({
        message: "User updated successfully",
        user,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error updating user",
        error: err.message,
      });
    });
}

export function getAllUsers(req, res) {
    if (req.user == null) {
        return res.status(403).json({
            message: "You need to login first"
        });
    }
   
    User.find().then((users) => {
        res.json(users);
    }).catch((err) => {
        console.error("Error fetching users:", err);
        res.status(500).json({
            message: "Error fetching users",
            error: err.message
        });
    });
}
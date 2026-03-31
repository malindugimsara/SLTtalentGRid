import express from 'express';
import { get } from 'mongoose';
import { changePassword, deleteUser, getAllUsers, getCurrentUser, loginUser, saveUser, sendOTP, updateUser } from '../controllers/UserController.js';

// Create a new router for user-related routes
const userRouter = express.Router();

// Define the route for saving a user
userRouter.post('/',saveUser)

// Define the route for logging in a user
userRouter.post('/login', loginUser)

//google login
// userRouter.post('/google', googleLogin)

userRouter.get('/current', getCurrentUser);

userRouter.post('/sendMail', sendOTP);

userRouter.post('/changepw', changePassword);

userRouter.delete('/:userID', deleteUser)

userRouter.put('/:userID', updateUser);

userRouter.get('/', getAllUsers)

export default userRouter;
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authjwt from './middleware/auth.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import emailRoutes from './routers/emailRoutes.js';
import { PipelineSingleton } from './controllers/aiController.js';
import userRouter from './routers/UserRouter.js';

dotenv.config();
const app = express();

// CORS (VERY IMPORTANT)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Request size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB
mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Middleware 
app.use(bodyParser.json());

app.use(authjwt)

// Routes
app.use('/api/emails', emailRoutes);
app.use("/api/user", userRouter);

// Start server after AI model loads
const startServer = async () => {
  try {
    await PipelineSingleton.init(); // preload AI model
    console.log("AI Model Loaded");

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });

  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
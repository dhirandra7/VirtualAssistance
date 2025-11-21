import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import geminiResponse from "./gemini.js";

const app = express();

// Connect to MongoDB first
connectDb();

// Enable CORS for your frontend Render URL
app.use(cors({
    origin: "https://virtualassistance-1-gy7v.onrender.com", //  live frontend URL
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

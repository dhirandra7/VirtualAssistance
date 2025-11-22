import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Connect Mongo
connectDb();

// 🔥 CORRECT CORS FOR RENDER + COOKIES
app.use(cors({
    origin: "https://virtualassistance-1-gy7v.onrender.com",  // your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Required for preflight OPTIONS on Render
app.options("*", cors({
    origin: "https://virtualassistance-1-gy7v.onrender.com",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Test route
app.get("/", (req, res) => {
    res.send("Backend running successfully!");
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

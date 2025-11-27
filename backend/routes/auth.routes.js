import express from "express";
import { Login, logOut, signUp } from "../controllers/auth.controllers.js";

const authRouter = express.Router();

// Signup
authRouter.post("/signup", signUp);

// Login (changed from /signin to /login to match frontend)
authRouter.post("/login", Login);

// Logout
authRouter.get("/logout", logOut);

export default authRouter;

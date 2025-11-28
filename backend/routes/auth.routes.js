import express from "express";
import { Login, logOut, signUp } from "../controllers/auth.controllers.js";

const authRouter = express.Router();

// Signup
authRouter.post("/signup", signUp);

// Login
authRouter.post("/login", Login);

// Logout
authRouter.get("/logout", logOut);

export default authRouter;

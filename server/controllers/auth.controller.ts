import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import JWT from "jsonwebtoken";
import Bcrypt from "bcrypt"


export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await AuthService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    await AuthService.register(email, password);
    res.status(201).json({ message: "User created successfully!" });

  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const LoginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await AuthService.findByEmail(email);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordIsValid = await Bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "Invalid Password"
            });
        }

        const secret = process.env.API_SECRET_KEY || "super-secret-key-change-me";
        
        const token = JWT.sign(
            { id: user.id || user._id }, 
            secret,
            { expiresIn: 86400 } 
        );

 
        return res.status(200).json({
            token: token,
            message: "Login successful"
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
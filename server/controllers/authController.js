import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export const registerUserController = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      error: "FirstName, LastName, Email and password are required"
    });
  }

  try {
    const userExists = await User.exists({ email });

    if (userExists) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash
    });

    await user.save();

    return res.status(201).json({
      message: "User registration was successful"
    });

  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    if (!process.env.JWT_SECRET_KEY) {
      throw new Error("JWT secret not set");
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      token,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
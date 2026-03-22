import { loginUserController, registerUserController } from "../controllers/authController.js";
import express from "express";

const router = express.Router();

router.post('/register', registerUserController);
router.post('/login', loginUserController);

export default router;
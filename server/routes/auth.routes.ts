import { Router } from 'express';
import { registerUser,LoginUser } from '../controllers/auth.controller.js';

const router = Router();


router.post('/register', registerUser);
router.post('/login',LoginUser)


export default router;
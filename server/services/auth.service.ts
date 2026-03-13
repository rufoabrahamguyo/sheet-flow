import bcrypt from 'bcrypt';
import { getDb } from '../config/db.js';
import { UserSchema } from '../models/User.js';

export const AuthService = {
  async register(email: string, password: string) {
    const db = getDb();
    
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: UserSchema = {
      email,
      passwordHash,
      createdAt: new Date()
    };

    return await db.collection('users').insertOne(newUser);
  },

  async findByEmail(email: string) {
    const db = getDb();
    return await db.collection('users').findOne({ email });
  }
};
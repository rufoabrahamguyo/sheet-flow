import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getDb } from '../db.js';
import { signAccessToken } from '../auth/jwt.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
const registerSchema = z.object({
    email: z.string().email().max(320),
    password: z.string().min(8).max(200),
});
const loginSchema = registerSchema;
function newId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Invalid registration payload' });
        return;
    }
    const { email, password } = parsed.data;
    const db = getDb();
    const existing = (await db.collection('users').findOne({ email }));
    if (existing) {
        res.status(409).json({ message: 'Email already registered' });
        return;
    }
    const password_hash = bcrypt.hashSync(password, 12);
    const id = newId('usr');
    const now = new Date().toISOString();
    await db.collection('users').insertOne({
        id,
        email,
        password_hash,
        createdAt: now,
    });
    const token = signAccessToken({ sub: id, email });
    res.json({ token, user: { id, email } });
});
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Invalid login payload' });
        return;
    }
    const { email, password } = parsed.data;
    const db = getDb();
    const row = (await db
        .collection('users')
        .findOne({ email }, { projection: { _id: 0, id: 1, email: 1, password_hash: 1 } }));
    if (!row) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
    }
    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
    }
    const token = signAccessToken({ sub: row.id, email: row.email });
    res.json({ token, user: { id: row.id, email: row.email } });
});
router.post('/logout', (_req, res) => {
    // JWT logout is client-side (delete token). Server can implement revocation later.
    res.json({ ok: true });
});
router.get('/me', requireAuth, (req, res) => {
    const r = req;
    res.json({ user: { id: r.user.id, email: r.user.email } });
});
export default router;

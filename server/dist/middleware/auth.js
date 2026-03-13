import { verifyAccessToken } from '../auth/jwt.js';
export function requireAuth(req, res, next) {
    const auth = req.headers.authorization ?? '';
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) {
        res.status(401).json({ message: 'Missing Bearer token' });
        return;
    }
    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, email: payload.email };
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

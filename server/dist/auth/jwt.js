import jwt from 'jsonwebtoken';
const jwtSecret = process.env.JWT_SECRET ?? '';
export function assertJwtConfigured() {
    if (!jwtSecret) {
        throw new Error('JWT_SECRET must be set');
    }
}
export function signAccessToken(payload) {
    assertJwtConfigured();
    return jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
}
export function verifyAccessToken(token) {
    assertJwtConfigured();
    return jwt.verify(token, jwtSecret);
}

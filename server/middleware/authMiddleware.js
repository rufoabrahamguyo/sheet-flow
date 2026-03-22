import { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const secret = process.env.API_SECRET_KEY || "your-secret-key";
        
        const decoded = JWT.verify(token, secret) as { id: string };
        
        req.userId = decoded.id;

        next();
        
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}
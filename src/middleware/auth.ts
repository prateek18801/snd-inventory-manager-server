import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type TJWTUser = {
    sub: string,
    role: "executive" | "manager" | "root",
    name: string,
    username: string
}

type TJWTPayload = {
    user: TJWTUser
}

interface AuthRequest extends Request {
    user?: TJWTUser
}

const ROLES = ["executive", "manager", "root"];
const auth = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const token = req.headers?.authorization?.split(" ")[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
                req.user = (decoded as TJWTPayload).user;
                if (role && ROLES.indexOf(req.user.role) < ROLES.indexOf(role)) {
                    return res.status(403).json({ message: "forbidden" });
                }
                return next();
            }
            return res.status(401).json({ message: "unauthorized" });
        } catch (err) {
            return res.status(401).json({ message: "unauthorized" });
        }
    }
}

export default auth;

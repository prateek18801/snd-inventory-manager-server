import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

const postLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (user && !user.archived) {
            if (await user.match(req.body.password)) {
                const payload = {
                    sub: user._id,
                    role: user.role,
                    name: user.name,
                    username: user.username,
                }
                const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "1d" });
                return res.status(200).json({
                    token,
                    user: payload
                });
            }
        }
        return res.status(401).json({
            message: "invalid credentials"
        });
    } catch (err) {
        next(err);
    }
}

export {
    postLogin
}

import { Request, Response, NextFunction } from "express";
import User from "../models/user";

const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find({ archived: false }).select({ password: 0 }).lean();
        return res.status(200).json(users);
    } catch (err) {
        next(err);
    }
}

const postUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await new User(req.body).save();
        return res.status(201).json({
            message: "created",
            data: user
        });
    } catch (err) {
        next(err);
    }
}

const patchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(400).json({
                message: "user not found"
            });
        }
        Object.keys(req.body).forEach(key => { if (req.body[key]) (user as any)[key] = req.body[key] });
        const updated = await user.save();
        return res.status(200).json({
            message: "user updated",
            data: {
                name: updated.name,
                role: updated.role,
                username: updated.username
            }
        });
    } catch (err) {
        next(err);
    }

}

const softDeleteUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { archived: true });
        return res.status(204).json();
    } catch (err) {
        next(err);
    }
}

const hardDeleteUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        return res.status(204).json();
    } catch (err) {
        next(err);
    }
}

export {
    getUsers,
    postUsers,
    patchUsers,
    softDeleteUsers,
    hardDeleteUsers
}

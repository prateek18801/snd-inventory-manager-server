import { Request, Response, NextFunction } from "express";
import User from "../models/user";

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    
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

}

const softDeleteUsers = async (req: Request, res: Response, next: NextFunction) => {

}

const hardDeleteUsers = async (req: Request, res: Response, next: NextFunction) => {

}

export {
    getUsers,
    postUsers,
    patchUsers,
    softDeleteUsers,
    hardDeleteUsers
}

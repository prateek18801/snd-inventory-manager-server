import { Request, Response, NextFunction } from "express";
import Picklist from "../models/picklist";

const getPicklists = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const picklist = await Picklist.find({}).lean();
        return res.status(200).json(picklist);
    } catch (err) {
        next(err);
    }
}

export {
    getPicklists
}

import { Request, Response, NextFunction } from "express";
import Category from "../models/category";

const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.find({}).lean();
        return res.status(200).json(categories);
    } catch (err) {
        next(err);
    }
}

const postCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await new Category(req.body).save();
        return res.status(201).json({
            message: "created",
            data: category
        });
    } catch (err) {
        next(err);
    }
}

const deleteCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        return res.status(204).json();
    } catch (err) {
        next(err);
    }
}

export {
    getCategories,
    postCategories,
    deleteCategories
}

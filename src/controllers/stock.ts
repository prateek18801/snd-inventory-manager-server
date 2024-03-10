import { Request, Response, NextFunction } from "express";
import Stock from "../models/stock";

const getStocks = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stock = await Stock.find({}).populate("product").populate("warehouse").lean();
        return res.status(200).json(stock);
    } catch (err) {
        next(err);
    }
}

export {
    getStocks
};

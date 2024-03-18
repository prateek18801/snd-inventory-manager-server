import { Request, Response, NextFunction } from "express";
import Stock from "../models/stock";

const getStocks = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stock = await Stock.find({ quantity: { $gt: 0 } }).populate("product").populate("warehouse").lean();
        return res.status(200).json(stock);
    } catch (err) {
        next(err);
    }
}

const getWarehouseBreakdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const breakdown = [];
        let required: number = Math.max(+(req.query.quantity || 0), 0);
        const stock = await Stock.find({ product: req.query.product, quantity: { $gt: 0 } }).populate("warehouse").sort({ quantity: 1 });
        for (const ws of stock) {
            if (ws.quantity <= required) {
                required -= ws.quantity;
                breakdown.push({
                    warehouse: ws.warehouse,
                    quantity: ws.quantity
                });
                continue;
            }
            if (required > 0) {
                breakdown.push({
                    warehouse: ws.warehouse,
                    quantity: required
                });
                required = 0;
            }
            break;
        }
        if (required) return res.status(400).json({
            message: `Requested quantity ${req.query.quantity} is greater than available quantity ${+(req.query.quantity || 0) - required}`
        });
        return res.status(200).json(breakdown);
    } catch (err) {
        next(err);
    }
}

export {
    getStocks,
    getWarehouseBreakdown
};

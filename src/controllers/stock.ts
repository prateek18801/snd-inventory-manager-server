import { writeFile } from "fs/promises";
import { Request, Response, NextFunction } from "express";
import { json2csv } from "json-2-csv";
import Stock from "../models/stock";

const getStocks = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stocks = await Stock.find({ quantity: { $gt: 0 } }).populate("product").populate("warehouse").lean();
        return res.status(200).json(stocks);
    } catch (err) {
        next(err);
    }
}

const getWarehouseBreakdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const breakdown = [];
        let required: number = Math.max(+(req.query.quantity || 0), 0);
        const stocks = await Stock.find({ product: req.query.product, quantity: { $gt: 0 } }).populate("warehouse").sort({ quantity: 1 });
        for (const stock of stocks) {
            if (stock.quantity <= required) {
                required -= stock.quantity;
                breakdown.push({
                    warehouse: stock.warehouse,
                    quantity: stock.quantity
                });
                continue;
            }
            if (required > 0) {
                breakdown.push({
                    warehouse: stock.warehouse,
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

const exportStocks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: { warehouse?: string } = {};
        if (req.query.warehouse) {
            filter.warehouse = req.query.warehouse as string;
        }
        const stocks = await Stock.find({ ...filter, quantity: { $gt: 0 } }).populate("product").populate("warehouse").lean();

        const json = stocks.map((stock, i) => ({
            "SNo": i + 1,
            "PId/SKU": (stock as any).product.p_id.toString(),
            "Product Name": (stock as any).product.name,
            "Image Url": (stock as any).product.image ?? "",
            "Warehouse": `${(stock as any).warehouse.name} (${(stock as any).warehouse.w_id})`,
            "Quantity": stock.quantity
        }));
        const csv = json2csv(json);
        await writeFile("inventory.csv", csv);
        return res.status(200).download("inventory.csv", `inventory${req.query.warehouse ? "_" + (stocks[0] as any).warehouse.w_id : ""}.csv`);
    } catch (err) {
        next(err);
    }
}

export {
    getStocks,
    getWarehouseBreakdown,
    exportStocks
};

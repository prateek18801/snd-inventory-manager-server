import { Request, Response, NextFunction } from "express";
import Product from "../models/product";
import Picklist from "../models/picklist";
import Warehouse from "../models/warehouse";
import Transaction from "../models/transaction";

const getAppContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.find({}).select("_id p_id name image").lean();
        const warehouse = await Warehouse.find({}).select("_id w_id name").lean();
        return res.status(200).json({
            product: product,
            warehouse: warehouse
        });
    } catch (err) {
        next(err);
    }
}

const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const start = `${req.query.start || new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]}T00:00:00.000+05:30`;
        const end = `${req.query.end || new Date().toISOString().split("T")[0]}T00:00:00.000+05:30`;

        const transactions = await Transaction.find({
            created_at: { $gte: start, $lte: end },
            action: "STOCK_OUT",
            reason: "picklist"
        }).lean();

        const frequency: Record<string, number> = {};
        for (const transaction of transactions) {
            if (!frequency[transaction.product.toString()]) {
                frequency[transaction.product.toString()] = transaction.quantity;
                continue;
            }
            frequency[transaction.product.toString()] += transaction.quantity;
        }

        const period = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

        const products = await Product.find({ _id: { $in: Object.keys(frequency) } }).lean();
        const trending = products.map(product => ({
            ...product,
            drr: Math.round((frequency[product._id.toString()] / period) * 10) / 10
        })).sort((a, b) => b.drr - a.drr);

        const picklists = await Picklist.find({ created_at: { $gte: start, $lte: end } }).lean();

        const distribution: Record<string, number> = {};
        for (const picklist of picklists) {
            const totalQty = picklist.list.reduce((acc, obj) => acc + obj.quantity, 0);
            if (!distribution[picklist.channel]) {
                distribution[picklist.channel] = totalQty;
                continue;
            }
            distribution[picklist.channel] += totalQty;
        }
        return res.status(200).json({
            trending,
            distribution
        });
    } catch (err) {
        next(err);
    }
}

export {
    getAppContext,
    getDashboard
}

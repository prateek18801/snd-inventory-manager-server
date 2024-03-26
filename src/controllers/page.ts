import { Request, Response, NextFunction } from "express";
import Product from "../models/product";
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
        const start = `${req.query.start || new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split("T")[0]}T00:00:00.000+05:30`;
        const end = `${req.query.end || new Date().toISOString().split("T")[0]}T00:00:00.000+05:30`;

        const filter: {
            created_at: { $gte: string, $lte: string },
            product?: string,
            warehouse?: string,
            user?: string
        } = { created_at: { $gte: start, $lte: end } };
        for (const key of ["product", "warehouse", "user"]) {
            if (req.query[key]) {
                (filter as any)[key] = req.query[key];
            }
        }

        const transactions = await Transaction.find(filter).lean();
        const frequency: Record<string, number> = {};
        for (const transaction of transactions) {
            if (!frequency[transaction.product.toString()]) {
                frequency[transaction.product.toString()] = 1;
                continue;
            }
            frequency[transaction.product.toString()]++;
        }

        const period = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

        const products = await Product.find({ _id: { $in: Object.keys(frequency) } }).lean();
        const trending = products.map(product => ({
            ...product,
            drr: frequency[product._id.toString()] / period
        })).sort((a, b) => b.drr - a.drr);

        return res.status(200).json({
            trending
        });
    } catch (err) {
        next(err);
    }
}

export {
    getAppContext,
    getDashboard
}

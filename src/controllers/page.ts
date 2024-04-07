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
        // set dashboard data start and end range
        const today = new Date();
        const start = `${req.query.start || new Date(today.setDate(today.getDate() - 1)).toLocaleDateString("fr-CA")}T00:00:00.000+05:30`;
        const end = `${req.query.end || new Date(today.setDate(today.getDate() - 1)).toLocaleDateString("fr-CA")}T23:59:59.999+05:30`;

        // find sales transactions in the date range
        const transactions = await Transaction.find({
            created_at: { $gte: start, $lte: end },
            action: "STOCK_OUT",
            reason: "picklist"
        }).lean();

        // calculate count of all products sold
        const productSalesFrequency: Record<string, number> = {};
        for (const transaction of transactions) {
            if (!productSalesFrequency[transaction.product.toString()]) {
                productSalesFrequency[transaction.product.toString()] = transaction.quantity;
                continue;
            }
            productSalesFrequency[transaction.product.toString()] += transaction.quantity;
        }

        // find difference in days
        const period = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

        // calculate drr for products sold in the date range
        const products = await Product.find({}).lean();
        const trendingProducts = [];
        const lowStockProducts = [];

        for (const product of products) {
            if (product._id.toString() in productSalesFrequency) {
                trendingProducts.push({
                    ...product,
                    drr: +(productSalesFrequency[product._id.toString()] / period).toFixed(1)
                });
            }
            if (product.stock && product.stock <= Math.ceil(product.drr * product.lead_time)) {
                lowStockProducts.push(product);
            }
        }

        trendingProducts.sort((a, b) => b.drr - a.drr);
        lowStockProducts.sort((a, b) => (Math.ceil(b.drr * b.lead_time) - b.stock) - (Math.ceil(a.drr * a.lead_time) - a.stock));

        // calculate channel distribution for sales
        const picklists = await Picklist.find({ created_at: { $gte: start, $lte: end } }).lean();
        const channelDistribution: Record<string, number> = {};
        for (const picklist of picklists) {
            const totalQty = picklist.list.reduce((acc, obj) => acc + obj.quantity, 0);
            if (!channelDistribution[picklist.channel]) {
                channelDistribution[picklist.channel] = totalQty;
                continue;
            }
            channelDistribution[picklist.channel] += totalQty;
        }

        return res.status(200).json({
            trending_products: trendingProducts,
            channel_distribution: channelDistribution,
            low_stock_products: lowStockProducts
        });
    } catch (err) {
        next(err);
    }
}

export {
    getAppContext,
    getDashboard
}

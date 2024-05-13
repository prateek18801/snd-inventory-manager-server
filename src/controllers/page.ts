import { Request, Response, NextFunction } from "express";
import { json2csv } from "json-2-csv";
import { writeFile } from "fs/promises";
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
                    range_drr: +(productSalesFrequency[product._id.toString()] / period).toFixed(1)
                });
            }
            if (product.stock && ((product.stock + product.in_transit) <= Math.ceil(product.drr * product.lead_time))) {
                lowStockProducts.push(product);
            }
        }

        trendingProducts.sort((a, b) => b.range_drr - a.range_drr);
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
            low_stock_products: lowStockProducts,
            channel_distribution: channelDistribution
        });
    } catch (err) {
        next(err);
    }
}

const getChannelReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // set dashboard data start and end range
        const start = `${req.query.start || new Date().toLocaleDateString("fr-CA")}T00:00:00.000+05:30`;
        const end = `${req.query.end || new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`;

        // const period = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

        const picklists = await Picklist.find({
            created_at: { $gte: start, $lte: end },
            channel: req.params.channel
        }).lean();


        // calculate product count map
        const productSaleCount: Record<string, number> = {};
        for (const picklist of picklists) {
            for (const record of picklist.list) {
                if (!productSaleCount[record.product.toString()]) {
                    productSaleCount[record.product.toString()] = record.quantity;
                    continue;
                }
                productSaleCount[record.product.toString()] += record.quantity;
            }
        }

        const products = await Product.find({ _id: { $in: Object.keys(productSaleCount) } });

        const json = products.map((product, i) => ({
            "SNo": i + 1,
            "PID/SKU": product.p_id,
            "Product Name": product.name,
            "Image Url": product.image,
            "Available Stock": product.stock,
            "Minimum Stock": product.lead_time * product.drr,
            "DRR(3D)": product.drr,
            "Total Sale": productSaleCount[product._id.toString()]
        }));

        const csv = json2csv(json)
        await writeFile(`sales_report_${req.params.channel ?? "combined"}.csv`, csv);
        return res.status(200).download(`sales_report_${req.params.channel ?? "combined"}.csv`);
    } catch (err) {
        next(err);
    }
}

const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // set dashboard data start and end range
        const start = `${req.query.start || new Date(new Date().setDate(new Date().getDate() - 2)).toLocaleDateString("fr-CA")}T00:00:00.000+05:30`;
        const end = `${req.query.end || new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`;

        const period = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

        const picklists = await Picklist.find({ created_at: { $gte: start, $lte: end } }).lean();

        const channelDayWiseSales: Record<string, Record<string, number>> = {};
        const productChannelWiseSales: Record<string, Record<string, number>> = {};

        for (const picklist of picklists) {
            let channelTotalSale: number = 0;
            for (const record of picklist.list) {
                const p_id = record.product.toString();
                channelTotalSale += record.quantity;

                if (!productChannelWiseSales[p_id]) {
                    productChannelWiseSales[p_id] = {};
                }
                productChannelWiseSales[p_id][picklist.channel] = (productChannelWiseSales[p_id][picklist.channel] ?? 0) + record.quantity;
            }
            if (!channelDayWiseSales[picklist.channel]) {
                channelDayWiseSales[picklist.channel] = {};
            }
            channelDayWiseSales[picklist.channel][((picklist as any).created_at).toLocaleDateString("fr-CA")] = (channelDayWiseSales[picklist.channel][((picklist as any).created_at).toLocaleDateString("fr-CA")] ?? 0) + channelTotalSale;
        }

        const products = await Product.find({ _id: { $in: Object.keys(productChannelWiseSales) } }).lean();

        const populatedProductSalesData = [];
        for (const product of products) {
            const channelWiseSales = productChannelWiseSales[product._id.toString()];
            populatedProductSalesData.push({
                ...product,
                saleChannels: channelWiseSales,
                totalSale: Object.values(channelWiseSales).reduce((a, b) => a + b, 0),
                period
            });
        }
        return res.status(200).json({
            channelSales: channelDayWiseSales,
            productSales: populatedProductSalesData
        });
    } catch (err) {
        next(err);
    }
}

export {
    getDashboard,
    getAppContext,
    getChannelReport,
    getDashboardAnalytics
}

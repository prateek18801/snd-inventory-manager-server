import { Request, Response, NextFunction } from "express";
import { json2csv, csv2json } from "json-2-csv";
import { writeFile } from "fs/promises";
import Product from "../models/product";
import Picklist from "../models/picklist";
import Warehouse from "../models/warehouse";
import Transaction from "../models/transaction";
import Adjustment from "../models/adjustment";

const getAppContext = async (_req: Request, res: Response, next: NextFunction) => {
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

const getInventoryDashboard = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await Product.find({}).lean();
        const lowStockProducts = [];
        const outOfStockProducts = [];

        for (const product of products) {
            // product.stock = Math.abs(product.stock);
            if (product.stock <= Math.ceil(product.drr * product.lead_time)) {
                lowStockProducts.push(product);
            }
            if (product.stock === 0) {
                outOfStockProducts.push(product);
            }
        }
        lowStockProducts.sort((a, b) => (Math.ceil(b.drr * b.lead_time) - b.stock - b.in_transit) - (Math.ceil(a.drr * a.lead_time) - a.stock - a.in_transit));
        outOfStockProducts.sort((a, b) => b.drr - a.drr);

        return res.status(200).json({
            lowStockProducts,
            outOfStockProducts
        });
    } catch (err) {
        next(err);
    }
}

const getAnalyticsDashboard = async (req: Request, res: Response, next: NextFunction) => {
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

const getChannelReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // set dashboard data start and end range
        const start = `${req.query.start || new Date().toLocaleDateString("fr-CA")}T00:00:00.000+05:30`;
        const end = `${req.query.end || new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`;
        let json: any[];
        if (req.params.channel) {
            const picklists = await Picklist.find({ created_at: { $gte: start, $lte: end }, channel: req.params.channel }).lean();

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
            json = products.map((product, i) => ({
                "SNo": i + 1,
                "PID/SKU": product.p_id,
                "Product Name": product.name,
                "Image Url": product.image,
                "Available Stock": product.stock,
                "Minimum Stock": product.lead_time * product.drr,
                "DRR(3D)": product.drr,
                "Total Sale": productSaleCount[product._id.toString()]
            }));
        } else {
            const picklists = await Picklist.find({ created_at: { $gte: start, $lte: end } }).lean();

            const productChannelWiseSales: Record<string, Record<string, number>> = {};
            for (const picklist of picklists) {
                for (const record of picklist.list) {
                    const p_id = record.product.toString();
                    if (!productChannelWiseSales[p_id]) {
                        productChannelWiseSales[p_id] = {};
                    }
                    productChannelWiseSales[p_id][picklist.channel] = (productChannelWiseSales[p_id][picklist.channel] ?? 0) + record.quantity;
                }
            }

            const products = await Product.find({ _id: { $in: Object.keys(productChannelWiseSales) } }).lean();
            json = products.map((product, i) => ({
                "SNo": i + 1,
                "PID/SKU": product.p_id,
                "Product Name": product.name,
                "Image Url": product.image,
                "Available Stock": product.stock,
                "Minimum Stock": product.lead_time * product.drr,
                "DRR(3D)": product.drr,
                "Amazon": productChannelWiseSales[product._id.toString()]["amazon"] ?? 0,
                "Flipkart": productChannelWiseSales[product._id.toString()]["flipkart"] ?? 0,
                "Firstcry": productChannelWiseSales[product._id.toString()]["firstcry"] ?? 0,
                "Jiomart": productChannelWiseSales[product._id.toString()]["jiomart"] ?? 0,
                "Website": productChannelWiseSales[product._id.toString()]["snd-website"] ?? 0,
                "SND App": productChannelWiseSales[product._id.toString()]["snd-app"] ?? 0,
                "Total Sales": Object.values(productChannelWiseSales[product._id.toString()]).reduce((a, b) => a + b, 0)
            }));
        }

        const csv = json2csv(json)
        await writeFile(`sales_report_${req.params.channel ?? "combined"}.csv`, csv);
        return res.status(200).download(`sales_report_${req.params.channel ?? "combined"}.csv`);
    } catch (err) {
        next(err);
    }
}

const getStockReportForDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: {
            created_at: { $gte: string, $lte: string },
            product?: string,
            warehouse?: string,
            action?: string,
            user?: string
        } = {
            created_at: {
                $gte: `${req.query.date || new Date().toLocaleDateString("fr-CA")}T00:00:00.000+05:30`,
                $lte: `${new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`
            }
        };
        for (const key of ["product", "warehouse", "action", "user"]) {
            if (req.query[key]) {
                (filter as any)[key] = req.query[key];
            }
        }

        const productQtyChange: Record<string, any> = {};

        let transactions: { action: string, quantity: number, product: string }[] = await Transaction.find(filter).select("action quantity product").lean();

        // stock report adjustment

        const adjustments: { action: string, quantity: number, product: string }[] = await Adjustment.find({
            created_at: {
                $gte: `${req.query.date || new Date().toLocaleDateString("fr-CA")}T00:00:00.000+05:30`,
                $lte: `${new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`
            }
        }).select("action quantity product").lean();

        transactions = transactions.concat(adjustments);

        // end of adjustment logic
        
        for (const transaction of transactions) {
            if (!productQtyChange[transaction.product.toString()]) {
                productQtyChange[transaction.product.toString()] = 0;
            }
            productQtyChange[transaction.product.toString()] += (transaction.action === "STOCK_IN" ? -transaction.quantity : transaction.quantity)
        }

        const products = await Product.find({}).select("p_id name image stock").lean();

        const json = products.map((product, i) => ({
            "SNo": i + 1,
            "id": product._id.toString(),
            "PId/SKU": product.p_id,
            "Product Name": product.name,
            "stock": product.stock + (productQtyChange[product._id.toString()] ?? 0),
            "Image": product.image
        }));

        const csv = json2csv(json);
        await writeFile("stock_report.csv", csv);
        return res.status(200).download("stock_report.csv", `STOCK_REPORT_${req.query.date?.toString()}.csv`);
    } catch (err) {
        next(err);
    }
}

const postStockAdjustments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.date) {
            return res.status(400).json({ message: "date is required" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "stock data file is required" });
        }

        const fileJson = csv2json(req.file.buffer.toString());        

        const productQtyChange: Record<string, any> = await getProductQtyChange(req.params.date);
        
        const products = await Product.find({}).select("p_id name image stock").lean();

        const productCurrentStockMap: Record<string, number> = {};

        for (const product of products) {
            productCurrentStockMap[product._id.toString()] = (product.stock + (productQtyChange[product._id.toString()] ?? 0))
        }

        const transactions: {
            action: "STOCK_IN" | "STOCK_OUT",
            quantity: number,
            product: string,
            created_at: string
        }[] = [];

        for (const product of fileJson) {
            const diff = +(product as any).stock - productCurrentStockMap[(product as any).id];       
            if (diff > 0) {
                transactions.push({
                    action: "STOCK_OUT",
                    quantity: Math.abs(diff),
                    product: (product as any).id,
                    created_at: `${req.params.date}T13:00:00.000+05:30`
                });
            } else if (diff < 0) {
                transactions.push({
                    action: "STOCK_IN",
                    quantity: Math.abs(diff),
                    product: (product as any).id,
                    created_at: `${req.params.date}T13:00:00.000+05:30`
                });
            }
        }

        console.log(transactions);        

        const data = await Adjustment.insertMany(transactions);

        return res.status(200).json({
            message: `update stock for date ${req.params.date}`,
            data
        });
    } catch (err) {
        next(err);
    }
}

const getProductQtyChange = async (date: string) => {

    const productQtyChange: Record<string, any> = {};

    const transactions: { action: string, quantity: number, product: string }[] = await Transaction.find({
        created_at: {
            $gte: `${date || new Date().toLocaleDateString("fr-CA")}T00:00:00.000+05:30`,
            $lte: `${new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`
        }
    }).select("action quantity product").lean();

    // stock report adjustment

    const adjustments: { action: string, quantity: number, product: string }[] = await Adjustment.find({
        created_at: {
            $gte: `${date || new Date().toLocaleDateString("fr-CA")}T00:00:00.000+05:30`,
            $lte: `${new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`
        }
    }).select("action quantity product").lean();

    transactions.concat(adjustments);

    // end of adjustment logic

    for (const transaction of transactions) {
        if (!productQtyChange[transaction.product.toString()]) {
            productQtyChange[transaction.product.toString()] = 0;
        }
        productQtyChange[transaction.product.toString()] += (transaction.action === "STOCK_IN" ? -transaction.quantity : transaction.quantity)
    }

    return productQtyChange;
}

export {
    getAppContext,
    getChannelReport,
    getInventoryDashboard,
    getAnalyticsDashboard,
    getStockReportForDate,
    postStockAdjustments
}

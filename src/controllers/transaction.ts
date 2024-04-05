import { writeFile } from "fs/promises";
import { Request, Response, NextFunction } from "express";
import { startSession, Types } from "mongoose";
import { json2csv } from "json-2-csv";
import Stock from "../models/stock";
import Product from "../models/product";
import Picklist from "../models/picklist";
import Transaction from "../models/transaction";

interface AuthRequest extends Request {
    user: {
        sub: string,
        role: "executive" | "manager" | "root",
        name: string,
        username: string
    }
}

const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: {
            created_at: { $gte: string, $lte: string },
            product?: string,
            warehouse?: string,
            user?: string
        } = {
            created_at: {
                $gte: `${req.query.start || new Date().toISOString().split("T")[0]}T00:00:00.000+05:30`,
                $lte: `${req.query.end || new Date().toISOString().split("T")[0]}T23:59:59.999+05:30`
            }
        };
        for (const key of ["product", "warehouse", "user"]) {
            if (req.query[key]) {
                (filter as any)[key] = req.query[key];
            }
        }

        const transactions = await Transaction.find(filter).populate("product").populate("warehouse").populate("user").sort({ created_at: -1 }).lean();
        return res.status(200).json(transactions);
    } catch (err) {
        next(err);
    }
}

const postTransactionsIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transaction = new Transaction(req.body);
        transaction.action = "STOCK_IN";
        transaction.user = new Types.ObjectId((req as AuthRequest).user.sub);

        const session = await startSession();
        session.startTransaction();
        try {
            await Product.findByIdAndUpdate(transaction.product, { $inc: { stock: transaction.quantity } }, { session });
            await Stock.findOneAndUpdate({ product: transaction.product, warehouse: transaction.warehouse }, { $inc: { quantity: transaction.quantity } }, { upsert: true, session });
            await transaction.save({ session });

            await session.commitTransaction();
            await session.endSession();

            return res.status(201).json({
                message: "Transaction successful",
                data: transaction
            });
        } catch (err) {
            await session.abortTransaction();
            await session.endSession();
            throw err;
        }
    } catch (err) {
        next(err);
    }
}

const postTransactionsOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // for processing multiple transactions (picklist)
        if (req.body.list && Array.isArray(req.body.list)) {
            const list = (req.body as any).list;
            const channel = (req.body as any).channel;
            const result = [];
            for (const item of list) {
                const stocks = await Stock.find({ product: item.product, quantity: { $gt: 0 } }).populate("warehouse").sort({ quantity: 1 });
                if (item.quantity > stocks.reduce((total, { quantity }) => total + quantity, 0)) continue;

                let required: number = item.quantity;
                const updates = [];
                const transactions = [];

                // for result
                const breakdown = [];
                for (const stock of stocks) {
                    if (stock.quantity <= required) {
                        transactions.push(new Transaction({
                            action: "STOCK_OUT",
                            reason: "picklist",
                            quantity: stock.quantity,
                            user: (req as AuthRequest).user.sub,
                            product: stock.product,
                            warehouse: stock.warehouse._id
                        }).save());

                        // for result
                        breakdown.push({
                            warehouse: stock.warehouse,
                            quantity: stock.quantity
                        });

                        required -= stock.quantity;
                        stock.quantity = 0;
                        updates.push(stock.save());
                        continue;
                    }
                    if (required > 0) {
                        transactions.push(new Transaction({
                            action: "STOCK_OUT",
                            reason: "picklist",
                            quantity: required,
                            user: (req as AuthRequest).user.sub,
                            product: stock.product,
                            warehouse: stock.warehouse._id
                        }).save());

                        // for result
                        breakdown.push({
                            warehouse: stock.warehouse,
                            quantity: required
                        });

                        stock.quantity -= required;
                        updates.push(stock.save());
                        required = 0;
                    }
                    break;
                }
                await Promise.all(updates);
                await Promise.all(transactions);
                const product = await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }, { new: true });
                result.push({
                    product: product,
                    quantity: item.quantity,
                    breakdown: breakdown
                });
            }
            await new Picklist({
                channel: channel,
                list: result
            }).save();

            return res.status(201).json({
                message: "Transaction successful",
                data: result
            });
        }

        // for processing single transaction 
        const transaction = new Transaction(req.body);
        transaction.action = "STOCK_OUT";
        transaction.user = new Types.ObjectId((req as AuthRequest).user.sub);

        const session = await startSession();
        session.startTransaction();
        try {

            const stock = await Stock.findOne({ product: transaction.product, warehouse: transaction.warehouse, quantity: { $gt: 0 } });
            if (!stock || stock.quantity < transaction.quantity) {
                return res.status(400).json({
                    message: `Requested quantity ${transaction.quantity} is greater than warehouse quantity ${stock?.quantity || 0}`
                });
            }

            await Product.findByIdAndUpdate(transaction.product, { $inc: { stock: -transaction.quantity } }, { session });
            await Stock.findOneAndUpdate({ product: transaction.product, warehouse: transaction.warehouse }, { $inc: { quantity: -transaction.quantity } }, { session });
            await transaction.save({ session });

            await session.commitTransaction();
            await session.endSession();

            return res.status(201).json({
                message: "Transaction successful",
                data: transaction
            });
        } catch (err) {
            await session.abortTransaction();
            await session.endSession();
            throw err;
        }
    } catch (err) {
        next(err);
    }
}

const exportTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: {
            created_at: { $gte: string, $lte: string },
            product?: string,
            warehouse?: string,
            user?: string
        } = {
            created_at: {
                $gte: `${req.query.start || new Date().toISOString().split("T")[0]}T00:00:00.000+05:30`,
                $lte: `${req.query.end || new Date().toISOString().split("T")[0]}T23:59:59.999+05:30`
            }
        };
        for (const key of ["product", "warehouse", "action", "user"]) {
            if (req.query[key]) {
                (filter as any)[key] = req.query[key];
            }
        }

        const transactions = await Transaction.find(filter).populate("product").populate("warehouse").populate("user").lean();
        const json = transactions.map((transaction, i) => ({
            "SNo": i + 1,
            "Txn Id": transaction._id.toString(),
            "Timestamp": new Date((transaction as any).created_at).toLocaleString(),
            "Action": transaction.action,
            "Reason": transaction.reason,
            "PId/SKU": (transaction as any).product.p_id,
            "Product Name": (transaction as any).product.name,
            "Warehouse": `${(transaction as any).warehouse.name} (${(transaction as any).warehouse.w_id})`,
            "Quantity": transaction.quantity,
            "Remarks": transaction.remarks ?? "",
        }));
        const csv = json2csv(json);
        await writeFile("transactions.csv", csv);
        return res.status(200).download("transactions.csv", `transactions.csv`);
    } catch (err) {
        next(err);
    }
}

export {
    getTransactions,
    postTransactionsIn,
    postTransactionsOut,
    exportTransactions
}

import { Request, Response, NextFunction } from "express";
import { startSession, Types } from "mongoose";
import Stock from "../models/stock";
import Product from "../models/product";
import Transaction from "../models/transaction";
import Picklist from "../models/picklist";

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
                $lte: `${req.query.end || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]}T00:00:00.000+05:30`
            }
        };
        for (const key of ["product", "warehouse", "user"]) {
            if (req.query[key]) {
                (filter as any)[key] = req.query[key];
            }
        }

        const transactions = await Transaction.find(filter).populate("product").populate("warehouse").populate("user").lean();
        return res.status(200).json(transactions);
    } catch (err) {
        next(err);
    }
}

const postTransactionsIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transaction = new Transaction(req.body);
        transaction.action = "STOCK_IN";
        // transaction.user = new Types.ObjectId(req.user.sub);
        transaction.user = new Types.ObjectId("65e4c6e211247715a07ead7e");

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
        if (Array.isArray(req.body)) {
            const result = [];
            for (const item of req.body) {
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
                            reason: "Outbound",
                            quantity: stock.quantity,
                            // user: new new Types.ObjectId(req.user.sub),
                            user: new Types.ObjectId("65e4c6e211247715a07ead7e"),
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
                            reason: "Outbound",
                            quantity: required,
                            // user: new new Types.ObjectId(req.user.sub),
                            user: new Types.ObjectId("65e4c6e211247715a07ead7e"),
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
            await new Picklist({ list: result }).save();

            return res.status(201).json({
                message: "Transaction Successful",
                data: result
            });
        }

        // for processing single transaction 
        const transaction = new Transaction(req.body);
        transaction.action = "STOCK_OUT";
        // transaction.user = new Types.ObjectId(req.user.sub);
        transaction.user = new Types.ObjectId("65e4c6e211247715a07ead7e");

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

export {
    getTransactions,
    postTransactionsIn,
    postTransactionsOut
}

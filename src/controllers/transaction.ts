import { Request, Response, NextFunction } from "express";
import { startSession, Types } from "mongoose";
import Stock from "../models/stock";
import Product from "../models/product";
import Transaction from "../models/transaction";

const getTransactions = async (req: Request, res: Response, next: NextFunction) => {

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
    
}

export {
    getTransactions,
    postTransactionsIn,
    postTransactionsOut
}

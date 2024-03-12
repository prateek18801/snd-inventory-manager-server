import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Stock from "../models/stock";
import Product from "../models/product";
import Transaction from "../models/transaction";

const getTransactions = async (req: Request, res: Response, next: NextFunction) => {

}

const postTransactionsIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transaction = new Transaction(req.body);
        // TODO - transaction.user = new Types.ObjectId(req.user.sub);
        transaction.user = new Types.ObjectId("65e4c6e211247715a07ead7e");

        const product = await Product.findById(transaction.product);
        const stock = await Stock.findOne({ product: transaction.product, warehouse: transaction.warehouse });
        
        if (!product) {
            return res.status(400).json({
                message: `Cannot find product with id="${transaction.product}"`
            });
        }
        product.stock = product.stock + transaction.quantity;

        if(!stock) {
            await new Stock({
                product: transaction.product,
                warehouse: transaction.warehouse,
                quantity: transaction.quantity
            }).save();
        } else {
            stock.quantity = stock.quantity + transaction.quantity;
            await stock.save();
        }

        await product.save();
        await transaction.save();
        return res.status(201).json({
            message: "Transaction successful",
            data: transaction
        });
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

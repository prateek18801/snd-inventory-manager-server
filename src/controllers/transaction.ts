import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Stock from "../models/stock";
import Product from "../models/product";
import Transaction from "../models/transaction";

const getTransactions = async (req: Request, res: Response, next: NextFunction) => {

}

const postTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transaction = new Transaction(req.body);
        // TODO - transaction.user = new Types.ObjectId(req.user.sub);
        transaction.user = new Types.ObjectId("65e4c6e211247715a07ead7e");

        const product = await Product.findById(transaction.product);
        
        // Ideally throw an error
        if (!product) return res.status(400).json({
            message: `Cannot find product with id = ${transaction.product}`
        });
        
        if (transaction.action === "STOCK_IN") {
            const stock = await Stock.findOne({ product: transaction.product, warehouse: transaction.warehouse });
            if (stock) {
                stock.quantity = stock.quantity + transaction.quantity;
                await stock.save();
            } else {
                await new Stock({
                    product: transaction.product,
                    warehouse: transaction.warehouse,
                    quantity: transaction.quantity
                }).save();
            }
            product.stock = product.stock + transaction.quantity;
        } else if (transaction.action === "STOCK_OUT") {
            // if (transaction.quantity > product.stock) {
            //     return res.status(400).json({
            //         message: `Requested quantity(${transaction.quantity}) is greater than the available stock(${product.stock})`
            //     });
            // }

            // product.stock = product.stock - transaction.quantity;
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

const deleteTransactions = async (req: Request, res: Response, next: NextFunction) => {

}

export {
    getTransactions,
    postTransactions,
    deleteTransactions
}

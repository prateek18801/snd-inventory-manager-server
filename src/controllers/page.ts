import { Request, Response, NextFunction } from "express";
import Product from "../models/product";
import Warehouse from "../models/warehouse";

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

export {
    getAppContext
}

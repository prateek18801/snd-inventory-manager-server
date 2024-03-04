import { Request, Response, NextFunction } from "express";
import Product from "../models/product";
import { s3UploadObject } from "../utils/aws";

const getProducts = async (req: Request, res: Response, next: NextFunction) => {

}

const postProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (await Product.findOne({ p_id: req.body.p_id })) {
            return res.status(200).json({
                message: "duplicate"
            });
        }

        const product = new Product(req.body);
        if (req.file) {
            await s3UploadObject({
                name: product._id.toString(),
                mimetype: req.file.mimetype,
                body: req.file.buffer
            });
            product.image = `https://bot-snd-im.s3.ap-south-1.amazonaws.com/${product._id.toString()}`;
        }
        const saved = await product.save();

        return res.status(201).json({
            message: "created",
            data: saved
        });
    } catch (err) {
        next(err);
    }
}

const patchProducts = async (req: Request, res: Response, next: NextFunction) => {

}

const deleteProducts = async (req: Request, res: Response, next: NextFunction) => {

}

export {
    getProducts,
    postProducts,
    patchProducts,
    deleteProducts
}

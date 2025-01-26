import { writeFile } from "fs/promises";
import { Request, Response, NextFunction } from "express";
import { json2csv } from "json-2-csv";
import Stock from "../models/stock";
import Product from "../models/product";
import Transaction from "../models/transaction";
// import { s3UploadObject, s3DeleteObject } from "../utils/aws";

const getProducts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await Product.find({}).lean();
        return res.status(200).json(products);
    } catch (err) {
        next(err);
    }
}

const postProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (await Product.findOne({ p_id: req.body.p_id })) {
            return res.status(409).json({
                message: "duplicate"
            });
        }
        const product = new Product(req.body);
        // if (req.file) {
        //     await s3UploadObject({
        //         name: product._id.toString(),
        //         mimetype: req.file.mimetype,
        //         body: req.file.buffer
        //     });
        // }
        product.image = `/public/${product._id.toString()}`;
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
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                message: "not found"
            });
        }
        // if (req.file) {
        //     await s3UploadObject({
        //         name: product._id.toString(),
        //         mimetype: req.file.mimetype,
        //         body: req.file.buffer
        //     });
        // }
        product.image = `/public/${product._id.toString()}`
        Object.assign(product, req.body);
        const saved = await product.save();
        return res.status(200).json({
            message: "updated",
            data: saved
        });
    } catch (err) {
        next(err);
    }
}

const deleteProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (deleted) {
            await Stock.deleteMany({ product: deleted._id });
            await Transaction.deleteMany({ product: deleted._id });
            // await s3DeleteObject(deleted._id.toString());
        }
        return res.status(204).json();
    } catch (err) {
        next(err);
    }
}

const exportProducts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await Product.find({}).lean();
        const json = products.map((product, i) => ({
            "SNo": i + 1,
            "PID/SKU": product.p_id,
            "Product Name": product.name,
            "Image Url": product.image,
            "Available Stock": product.stock,
            "Minimum Stock": product.lead_time * product.drr,
            "DRR(3D)": product.drr,
            "Lead Time(D)": product.lead_time
        }));
        const csv = json2csv(json);
        await writeFile("products.csv", csv);
        return res.status(200).download("products.csv");
    } catch (err) {
        next(err);
    }
}

export {
    getProducts,
    postProducts,
    patchProducts,
    deleteProducts,
    exportProducts
}

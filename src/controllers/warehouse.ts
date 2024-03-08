import { Request, Response, NextFunction } from "express";
import Warehouse from "../models/warehouse";

const getWarehouses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const warehouse = await Warehouse.find({}).lean();
        return res.status(200).json(warehouse);
    } catch (err) {
        next(err);
    }
}

const postWarehouses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (await Warehouse.findOne({ w_id: req.body.w_id })) {
            return res.status(409).json({
                message: "duplicate"
            });
        }
        const warehouse = await new Warehouse(req.body).save();
        return res.status(201).json({
            message: "created",
            data: warehouse
        });
    } catch (err) {
        next(err);
    }
}

const patchWarehouses = async (req: Request, res: Response, next: NextFunction) => {

}

const deleteWarehouses = async (req: Request, res: Response, next: NextFunction) => {

}

export {
    getWarehouses,
    postWarehouses,
    patchWarehouses,
    deleteWarehouses
}

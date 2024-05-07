import { Request, Response, NextFunction } from "express";
import Shipment from "../models/shipment";
import Product from "../models/product";

const getShipments = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const shipments = await Shipment.find({}).populate("list.product").lean();
        return res.status(200).json(shipments);
    } catch (err) {
        next(err);
    }
}

const postShipments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shipment = await new Shipment(req.body).save();
        const pending = [];
        for (const record of shipment.list) {
            pending.push(Product.findByIdAndUpdate(record.product, { $inc: { in_transit: +record.quantity } }));
        }
        await Promise.all(pending);
        return res.status(201).json({
            message: "created",
            data: shipment
        });
    } catch (err) {
        next(err);
    }
}

const patchShipments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) return res.status(404).json({
            message: "shipment not found"
        });
        const pending = [];
        for (const record of shipment.list) {
            pending.push(Product.findByIdAndUpdate(record.product, { $inc: { in_transit: -record.quantity } }));
        }
        await Promise.all(pending);

        if (req.body.received === true) {
            shipment.received = true;
            await shipment.save();
            return res.status(200).json({
                message: "updated in-transit stock",
                data: shipment
            });
        }

        pending.length = 0;
        for (const record of req.body.list) {
            pending.push(Product.findByIdAndUpdate(record.product, { $inc: { in_transit: +record.quantity } }));
        }
        await Promise.all(pending);
        const updated = await Shipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.status(201).json({
            message: "created",
            data: updated
        });
    } catch (err) {
        next(err);
    }
}

const deleteShipments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) return res.status(204).json();
        const pending = [];
        for (const record of shipment.list) {
            pending.push(Product.findByIdAndUpdate(record.product, { $inc: { in_transit: -record.quantity } }));
        }
        await Promise.all(pending);
        await Shipment.findByIdAndDelete(req.params.id);
        return res.status(204).json();
    } catch (err) {
        next(err);
    }
}

export {
    getShipments,
    postShipments,
    patchShipments,
    deleteShipments
}

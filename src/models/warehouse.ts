import { Schema, model } from "mongoose";

interface IWarehouse {
    w_id: string,
    name: string,
    location?: string,
    description?: string
};

const WarehouseSchema = new Schema({
    w_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String },
    description: { type: String }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model<IWarehouse>("Warehouse", WarehouseSchema);

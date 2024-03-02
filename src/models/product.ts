import { Schema, model } from "mongoose";

interface IProduct {
    p_id: string,
    name: string,
    image: string,
    alert: number,
    stock: number,
    price?: number,
    description?: string,
};

const ProductSchema = new Schema({
    p_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    alert: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    price: { type: Number },
    description: { type: String }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model<IProduct>("Product", ProductSchema);

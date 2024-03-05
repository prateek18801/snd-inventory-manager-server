import { Schema, model } from "mongoose";

interface IProduct {
    p_id: string,
    name: string,
    alert: number,
    stock: number,
    image?: string,
    description?: string,
};

const ProductSchema = new Schema({
    p_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    alert: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    image: { type: String },
    description: { type: String }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model<IProduct>("Product", ProductSchema);

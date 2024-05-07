import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
    p_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    stock: { type: Number, default: 0 },
    in_transit: { type: Number, default: 0 },
    lead_time: { type: Number, required: true },
    drr: { type: Number, default: 0 },
    image: { type: String }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("Product", ProductSchema);

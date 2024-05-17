import { Schema, model } from "mongoose";

const PicklistSchema = new Schema({
    channel: { type: String, required: true },
    list: [{
        product: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
        quantity: { type: Number, required: true },
        breakdown: [{
            warehouse: { type: Schema.Types.ObjectId, required: true, ref: "Warehouse" },
            quantity: { type: Number, required: true }
        }]
    }],
    user: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("Picklist", PicklistSchema);

import { Schema, model } from "mongoose";

const TransactionSchema = new Schema({
    action: { type: String, enum: ["STOCK_IN", "STOCK_OUT"], required: true },
    reason: { type: String, required: true },
    quantity: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    remarks: { type: String }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("Transaction", TransactionSchema);

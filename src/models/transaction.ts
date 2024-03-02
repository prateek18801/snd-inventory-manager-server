import { Schema, model } from "mongoose";

interface ITransaction {
    action: "STOCK_IN" | "STOCK_OUT",
    reason: string,
    user_id: Schema.Types.ObjectId,
    product_id: Schema.Types.ObjectId,
    warehouse_id: Schema.Types.ObjectId,
    quantity: number,
    amount?: number,
    remarks?: string,
};

const TransactionSchema = new Schema({
    action: { type: String, enum: ["STOCK_IN", "STOCK_OUT"], required: true },
    reason: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    warehouse_id: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number },
    remarks: { type: String }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model<ITransaction>("Transaction", TransactionSchema);

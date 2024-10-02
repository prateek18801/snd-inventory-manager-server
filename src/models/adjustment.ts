import { Schema, model } from "mongoose";

const AdjustmentSchema = new Schema({
    action: { type: String, enum: ["STOCK_IN", "STOCK_OUT"], required: true },
    quantity: { type: Number, required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    created_at: {type: Date}
});

export default model("Adjustment", AdjustmentSchema);

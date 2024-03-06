import { Schema, model } from "mongoose";

const StockSchema = new Schema({
    product_id: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: "Warehouse" },
    quantity: { type: Number, default: 0 }
});

export default model("Stock", StockSchema);

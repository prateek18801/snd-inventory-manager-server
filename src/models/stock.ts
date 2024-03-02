import { Schema, model } from "mongoose";

interface IStock {
    product_id: Schema.Types.ObjectId,
    warehouse_id: Schema.Types.ObjectId,
    quantity: number
};

const StockSchema = new Schema({
    product_id: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: "Warehouse" },
    quantity: { type: Number, required: true }
});

export default model<IStock>("Stock", StockSchema);

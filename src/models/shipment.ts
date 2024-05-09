import { Schema, model } from "mongoose";

const ShipmentSchema = new Schema({
    container: { type: String, required: true },
    list: [{
        product: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
        quantity: { type: Number, required: true }
    }],
    received: { type: Boolean, default: false },
    expected_delivery: { type: Date }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("Shipment", ShipmentSchema);

import { Schema, model } from "mongoose";

const CategorySchema = new Schema({
    name: { type: String, required: true },
    amazon: { type: String },
    flipkart: { type: String }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

export default model("Category", CategorySchema);

import { Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";

interface IUser {
    name: string,
    role: string,
    username: string,
    password: string,
    archive: boolean
};

const UserSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, unique: true },
    role: { type: String, enum: ["root", "manager", "executive"], required: true },
    archive: { type: Boolean, default: false }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await hash(this.password, 10);
    }
    next();
});

UserSchema.methods.match = async function (password: string) {
    return compare(password, this.password);
};

export default model<IUser>("User", UserSchema);

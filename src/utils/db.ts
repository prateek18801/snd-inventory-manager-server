import mongoose from "mongoose";

const connect = async () => {
    try {
        await mongoose.connect(process.env.DB_URI as string);
        console.log("✅ db connected");
    } catch (err) {
        console.log("❌ db connection failed", (err as any).code);
    }
    mongoose.connection.on("disconnected", () => { console.log("❌ db disconnected"); });
    mongoose.connection.on("reconnected", () => { console.log("✅ db reconnected"); });
}

export default { connect };

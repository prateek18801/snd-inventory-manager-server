import express, { Express } from "express";

const app: Express = express();

app.get("/ping", (_req, res) => {
    return res.status(200).json({
        message: "✅ server running"
    });
});

app.listen(3000, () => {
    console.log("✅ server started");
});

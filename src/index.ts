import express, { json, urlencoded, Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import router from "./router";
import db from "./utils/db";

const app: Express = express();
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));

app.use(router);

app.get("/ping", (_req: Request, res: Response, _next: NextFunction) => {
    return res.status(200).json({
        message: "✅ server running"
    });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    return res.status(500).json({
        message: (err as Error).message,
        error: err
    });
});

app.listen(process.env.PORT, () => {
    console.log("✅ server started");
    db.connect();
});

import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { postLogin } from "../controllers/auth";
import {
    postUsers,
    softDeleteUsers,
    hardDeleteUsers
} from "../controllers/user";
import {
    getStocks,
    getWarehouseBreakdown,
    exportStocks
} from "../controllers/stock";
import {
    getProducts,
    postProducts,
    patchProducts,
    deleteProducts,
    exportProducts
} from "../controllers/product";
import {
    getWarehouses,
    postWarehouses,
    deleteWarehouses
} from "../controllers/warehouse";
import {
    getTransactions,
    postTransactionsIn,
    postTransactionsOut,
    exportTransactions
} from "../controllers/transaction";
import { getAppContext, getDashboard } from "../controllers/page";

const router: Router = Router();
const upload = multer({ storage: memoryStorage() });

// auth routes
router.post("/v1/login", postLogin);

// user routes
router.post("/v1/users", postUsers);
router.delete("/v1/users/:id", softDeleteUsers);
router.delete("/v1/users/hard/:id", hardDeleteUsers);

// product routes
router.get("/v1/products", getProducts);
router.post("/v1/products", upload.single("image"), postProducts);
router.patch("/v1/products/:id", upload.single("image"), patchProducts);
router.delete("/v1/products/:id", deleteProducts);
router.get("/v1/product/export", exportProducts);

// warehouse routes
router.get("/v1/warehouses", getWarehouses);
router.post("/v1/warehouses", postWarehouses);
router.delete("/v1/warehouses/:id", deleteWarehouses);

// stock routes
router.get("/v1/stocks", getStocks);
router.get("/v1/breakdown", getWarehouseBreakdown);
router.get("/v1/stocks/export", exportStocks);

// transaction routes
router.get("/v1/transactions", getTransactions);
router.post("/v1/transactions/in", postTransactionsIn);
router.post("/v1/transactions/out", postTransactionsOut);
router.get("/v1/transactions/export", exportTransactions);

// application routes
router.get("/v1/app/context", getAppContext);
router.get("/v1/app/dashboard", getDashboard);

export default router;

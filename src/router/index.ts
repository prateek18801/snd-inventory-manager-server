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
    getWarehouseBreakdown
} from "../controllers/stock";
import {
    getProducts,
    postProducts,
    patchProducts,
    deleteProducts
} from "../controllers/product";
import {
    getWarehouses,
    postWarehouses,
    deleteWarehouses
} from "../controllers/warehouse";
import {
    getTransactions,
    postTransactionsIn,
    postTransactionsOut
} from "../controllers/transaction";
import { getAppContext } from "../controllers/page";

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

// warehouse routes
router.get("/v1/warehouses", getWarehouses);
router.post("/v1/warehouses", postWarehouses);
router.delete("/v1/warehouses/:id", deleteWarehouses);

// stock routes
router.get("/v1/stocks", getStocks);
router.get("/v1/breakdown", getWarehouseBreakdown);

// transaction routes
router.get("/v1/transactions", getTransactions);
router.post("/v1/transactions/in", postTransactionsIn);
router.post("/v1/transactions/out", postTransactionsOut);

// application routes
router.get("/v1/app/context", getAppContext);

export default router;

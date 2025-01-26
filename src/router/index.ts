import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { postLogin } from "../controllers/auth";
import {
    getUsers,
    postUsers,
    patchUsers,
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
import {
    getAppContext,
    getChannelReport,
    getAnalyticsDashboard,
    getInventoryDashboard,
    getStockReportForDate
} from "../controllers/page";
import auth from "../middleware/auth";
import { deleteShipments, getShipments, patchShipments, postShipments } from "../controllers/shipment";
import { deleteCategories, getCategories, postCategories } from "../controllers/category";

const router: Router = Router();
const upload = multer({ dest: "public/" });

// auth routes
router.post("/v1/login", postLogin);

// user routes
router.get("/v1/users", auth("manager"), getUsers);
router.post("/v1/users", auth("manager"), postUsers);
router.patch("/v1/users/:id", auth("manager"), patchUsers);
router.delete("/v1/users/:id", auth("manager"), softDeleteUsers);
router.delete("/v1/users/hard/:id", auth("root"), hardDeleteUsers);

// product routes
router.get("/v1/products", auth("manager"), getProducts);
router.post("/v1/products", auth("manager"), upload.single("image"), postProducts);
router.patch("/v1/products/:id", auth("manager"), upload.single("image"), patchProducts);
router.delete("/v1/products/:id", auth("manager"), deleteProducts);
router.get("/v1/product/export", exportProducts);

// warehouse routes
router.get("/v1/warehouses", auth("manager"), getWarehouses);
router.post("/v1/warehouses", auth("manager"), postWarehouses);
router.delete("/v1/warehouses/:id", auth("manager"), deleteWarehouses);

// stock routes
router.get("/v1/stocks", auth("executive"), getStocks);
router.get("/v1/breakdown", auth("executive"), getWarehouseBreakdown);
router.get("/v1/stocks/export", exportStocks);

// shipment routes
router.get("/v1/shipments", auth("manager"), getShipments);
router.post("/v1/shipments", auth("manager"), postShipments);
router.patch("/v1/shipments/:id", auth("manager"), patchShipments);
router.delete("/v1/shipments/:id", auth("manager"), deleteShipments);

// transaction routes
router.get("/v1/transactions", auth("manager"), getTransactions);
router.post("/v1/transactions/in", auth("executive"), postTransactionsIn);
router.post("/v1/transactions/out", auth("executive"), postTransactionsOut);
router.get("/v1/transactions/export", exportTransactions);

// category routes
router.get("/v1/categories", auth("manager"), getCategories);
router.post("/v1/categories", auth("manager"), postCategories);
router.delete("/v1/categories/:id", auth("manager"), deleteCategories);

// application routes
router.get("/v1/app/context", auth("executive"), getAppContext);
router.get("/v1/app/dash/inventory", auth("manager"), getInventoryDashboard);
router.get("/v1/app/dash/analytics", auth("manager"), getAnalyticsDashboard);
router.get("/v1/sales-report/export/:channel?", getChannelReport);
router.get("/v1/stock-report/export", getStockReportForDate);

export default router;

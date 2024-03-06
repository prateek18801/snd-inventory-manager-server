import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { postUsers } from "../controllers/user";
import { postLogin } from "../controllers/auth";
import {
    getProducts,
    postProducts,
    patchProducts,
    deleteProducts
} from "../controllers/product";
import { postWarehouses } from "../controllers/warehouse";

const router: Router = Router();
const upload = multer({ storage: memoryStorage() });

// auth routes
router.post("/v1/login", postLogin);

// user routes
router.post("/v1/users", postUsers);

// product routes
router.get("/v1/products", getProducts);
router.post("/v1/products", upload.single("image"), postProducts);
router.patch("/v1/products/:id", upload.single("image"), patchProducts);
router.delete("/v1/products/:id", deleteProducts);

// warehouse routes
router.post("/v1/warehouses", postWarehouses);

export default router;

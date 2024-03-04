import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { postUsers } from "../controllers/user";
import { postLogin } from "../controllers/auth";
import { postProducts } from "../controllers/product";

const router: Router = Router();
const upload = multer({ storage: memoryStorage() });

// auth routes
router.post("/v1/login", postLogin);

// user routes
router.post("/v1/users", postUsers);

// product routes
router.post("/v1/products", upload.single("image"), postProducts);

export default router;

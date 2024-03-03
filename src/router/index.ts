import { Router } from "express";
import { postUsers } from "../controllers/user";
import { postLogin } from "../controllers/auth";

const router: Router = Router();

// auth routes
router.post("/v1/login", postLogin);

// user routes
router.post("/v1/users", postUsers);

export default router;

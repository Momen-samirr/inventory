import { Router } from "express";
import { loginController, registerController, getMeController, logoutController } from "../controllers/authController";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { UserRole } from "@prisma/client";

const router = Router();

router.post("/login", loginController);
router.post("/register", authenticate, requireRole(UserRole.ADMIN), registerController);
router.post("/logout", optionalAuthenticate, logoutController);
router.get("/me", authenticate, getMeController);

export default router;


import { Router } from "express";
import { createSaleController, getSalesController } from "../controllers/salesController";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("inventory:write"), createSaleController);
router.get("/", requirePermission("inventory:read"), getSalesController);

export default router;


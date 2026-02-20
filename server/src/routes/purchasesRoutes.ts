import { Router } from "express";
import { createPurchaseController, getPurchasesController } from "../controllers/purchasesController";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.use(authenticate);

router.post("/", requirePermission("inventory:write"), createPurchaseController);
router.get("/", requirePermission("inventory:read"), getPurchasesController);

export default router;


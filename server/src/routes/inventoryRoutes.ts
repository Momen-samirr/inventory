import { Router } from "express";
import {
  adjustStockController,
  getStockMovementsController,
  getLowStockController,
} from "../controllers/inventoryController";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.use(authenticate);

router.post("/adjust", requirePermission("inventory:write"), adjustStockController);
router.get("/movements", requirePermission("inventory:read"), getStockMovementsController);
router.get("/low-stock", requirePermission("inventory:read"), getLowStockController);

export default router;


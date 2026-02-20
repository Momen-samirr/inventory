import { Router } from "express";
import { getExpensesByCategory } from "../controllers/expenseController";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("expenses:read"), getExpensesByCategory);

export default router;

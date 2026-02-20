import { Router } from "express";
import { getAuditLogsController } from "../controllers/auditController";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("audit:read"), getAuditLogsController);

export default router;


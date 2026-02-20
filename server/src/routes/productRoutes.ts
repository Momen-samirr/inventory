import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../controllers/productController";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/", authenticate, requirePermission("products:read"), getProducts);
router.get("/:id", authenticate, requirePermission("products:read"), getProduct);
router.post("/", authenticate, requirePermission("products:write"), createProduct);
router.put("/:id", authenticate, requirePermission("products:write"), updateProduct);
router.delete("/:id", authenticate, requirePermission("products:delete"), deleteProduct);
router.post("/:id/image", authenticate, requirePermission("products:write"), upload.single("image"), uploadProductImage);

export default router;

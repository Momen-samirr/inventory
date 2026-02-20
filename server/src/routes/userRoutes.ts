import { Router } from "express";
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadUserImage,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { UserRole } from "@prisma/client";
import { upload } from "../middleware/upload";

const router = Router();

router.use(authenticate);

// POST /users - Only Admin can create users
router.post("/", requireRole(UserRole.ADMIN), createUser);

// GET /users - Admin can view all users
router.get("/", requireRole(UserRole.ADMIN), getUsers);

// GET /users/:id - Admin can view a user
router.get("/:id", requireRole(UserRole.ADMIN), getUser);

// PUT /users/:id - Admin can update users
router.put("/:id", requireRole(UserRole.ADMIN), updateUser);

// DELETE /users/:id - Admin can delete users
router.delete("/:id", requireRole(UserRole.ADMIN), deleteUser);

// POST /users/:id/image - Users can upload their own image, admins can upload any
router.post("/:id/image", upload.single("image"), uploadUserImage);

export default router;

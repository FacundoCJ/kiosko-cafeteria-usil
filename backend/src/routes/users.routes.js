import { Router } from "express";
import {
  createUser,
  getUserById,
  getUsers,
  toggleUserStatus,
  updateUser
} from "../controllers/users.controller.js";
import {
  authenticate,
  authorizeRoles
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getUsers
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  getUserById
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  createUser
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  updateUser
);

router.patch(
  "/:id/toggle-status",
  authenticate,
  authorizeRoles("ADMIN"),
  toggleUserStatus
);

export default router;
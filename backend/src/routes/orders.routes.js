import { Router } from "express";
import {
  createOrder,
  getOrderById,
  getOrders,
  getPublicOrderStatus,
  getPublicTicketByOrderNumber,
  updateOrderStatus
} from "../controllers/orders.controller.js";
import {
  authenticate,
  authorizeRoles
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", createOrder);

router.get("/public/status", getPublicOrderStatus);
router.get("/public/ticket/:orderNumber", getPublicTicketByOrderNumber);

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA", "COCINA"),
  getOrders
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA", "COCINA"),
  getOrderById
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA", "COCINA"),
  updateOrderStatus
);

export default router;
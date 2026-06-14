import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrderActions,
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
  "/:id/actions",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA", "COCINA"),
  getOrderActions
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

router.patch(
  "/:id/cancel",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  cancelOrder
);

export default router;
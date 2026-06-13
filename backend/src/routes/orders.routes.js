import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} from "../controllers/orders.controller.js";

const router = Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

export default router;
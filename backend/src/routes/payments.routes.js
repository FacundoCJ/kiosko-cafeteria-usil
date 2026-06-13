import { Router } from "express";
import {
  simulatePayment,
  getPayments,
  getPaymentById
} from "../controllers/payments.controller.js";

const router = Router();

router.post("/simulate", simulatePayment);
router.get("/", getPayments);
router.get("/:id", getPaymentById);

export default router;
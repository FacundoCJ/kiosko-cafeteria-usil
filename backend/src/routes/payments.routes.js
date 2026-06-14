import { Router } from "express";
import {
  simulatePayment,
  getPayments,
  getPaymentById
} from "../controllers/payments.controller.js";
import {
  authenticate,
  authorizeRoles
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/simulate", simulatePayment);

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  getPayments
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  getPaymentById
);

export default router;
import { Router } from "express";
import {
  getSalesByDayReport,
  getSummaryReport,
  getTopProductsReport
} from "../controllers/reports.controller.js";
import {
  authenticate,
  authorizeRoles
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/summary",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  getSummaryReport
);

router.get(
  "/top-products",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  getTopProductsReport
);

router.get(
  "/sales-by-day",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  getSalesByDayReport
);

export default router;
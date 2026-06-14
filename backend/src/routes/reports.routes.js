import { Router } from "express";
import {
  getDailyCloseReport,
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

router.get(
  "/daily-close",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  getDailyCloseReport
);

export default router;
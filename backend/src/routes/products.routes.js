import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProductById,
  getProducts,
  toggleProductStatus,
  updateProduct,
  updateProductStock
} from "../controllers/products.controller.js";
import {
  authenticate,
  authorizeRoles
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.get(
  "/admin/categories",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  getCategories
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  createProduct
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  updateProduct
);

router.patch(
  "/:id/stock",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  updateProductStock
);

router.patch(
  "/:id/toggle-status",
  authenticate,
  authorizeRoles("ADMIN", "CAFETERIA"),
  toggleProductStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  deleteProduct
);

export default router;
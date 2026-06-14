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

const router = Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);

router.post("/", createProduct);

router.put("/:id", updateProduct);
router.patch("/:id/stock", updateProductStock);
router.patch("/:id/toggle-status", toggleProductStatus);

router.delete("/:id", deleteProduct);

export default router;
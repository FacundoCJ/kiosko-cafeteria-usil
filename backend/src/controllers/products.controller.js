import { products } from "../database/products.data.js";

export const getProducts = (req, res) => {
  res.json({
    ok: true,
    total: products.length,
    products
  });
};

export const getProductById = (req, res) => {
  const productId = Number(req.params.id);

  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({
      ok: false,
      message: "Producto no encontrado"
    });
  }

  res.json({
    ok: true,
    product
  });
};
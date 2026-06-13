import { prisma } from "../config/prisma.js";

const formatProduct = (product) => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category.name,
    price: Number(product.price),
    stock: product.stock,
    image: product.image,
    isActive: product.isActive
  };
};

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: {
        id: "asc"
      }
    });

    res.json({
      ok: true,
      total: products.length,
      products: products.map(formatProduct)
    });
  } catch (error) {
    console.error("Error obteniendo productos:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener productos"
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      include: {
        category: true
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado"
      });
    }

    res.json({
      ok: true,
      product: formatProduct(product)
    });
  } catch (error) {
    console.error("Error obteniendo producto:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener producto"
    });
  }
};
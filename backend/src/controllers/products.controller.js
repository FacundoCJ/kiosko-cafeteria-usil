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
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
};

export const getProducts = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const products = await prisma.product.findMany({
      where: includeInactive === "true" ? {} : { isActive: true },
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

    if (!product) {
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

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc"
      }
    });

    res.json({
      ok: true,
      total: categories.length,
      categories
    });
  } catch (error) {
    console.error("Error obteniendo categorías:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener categorías"
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      image,
      categoryName
    } = req.body;

    if (!name || !description || price === undefined || stock === undefined || !categoryName) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, descripción, precio, stock y categoría son obligatorios"
      });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El precio debe ser mayor a 0"
      });
    }

    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({
        ok: false,
        message: "El stock no puede ser negativo"
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive"
        }
      }
    });

    if (existingProduct) {
      return res.status(400).json({
        ok: false,
        message: "Ya existe un producto con ese nombre"
      });
    }

    const category = await prisma.category.upsert({
      where: {
        name: categoryName.trim()
      },
      update: {},
      create: {
        name: categoryName.trim()
      }
    });

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        image: image?.trim() || "food",
        isActive: true,
        categoryId: category.id
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      ok: true,
      message: "Producto creado correctamente",
      product: formatProduct(newProduct)
    });
  } catch (error) {
    console.error("Error creando producto:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al crear producto"
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const {
      name,
      description,
      price,
      stock,
      image,
      categoryName,
      isActive
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado"
      });
    }

    const dataToUpdate = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          ok: false,
          message: "El nombre no puede estar vacío"
        });
      }

      const duplicatedProduct = await prisma.product.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: "insensitive"
          },
          NOT: {
            id: productId
          }
        }
      });

      if (duplicatedProduct) {
        return res.status(400).json({
          ok: false,
          message: "Ya existe otro producto con ese nombre"
        });
      }

      dataToUpdate.name = name.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          ok: false,
          message: "La descripción no puede estar vacía"
        });
      }

      dataToUpdate.description = description.trim();
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          ok: false,
          message: "El precio debe ser mayor a 0"
        });
      }

      dataToUpdate.price = parsedPrice;
    }

    if (stock !== undefined) {
      const parsedStock = Number(stock);

      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          ok: false,
          message: "El stock no puede ser negativo"
        });
      }

      dataToUpdate.stock = parsedStock;
    }

    if (image !== undefined) {
      dataToUpdate.image = image?.trim() || "food";
    }

    if (isActive !== undefined) {
      dataToUpdate.isActive = Boolean(isActive);
    }

    if (categoryName !== undefined) {
      if (!categoryName.trim()) {
        return res.status(400).json({
          ok: false,
          message: "La categoría no puede estar vacía"
        });
      }

      const category = await prisma.category.upsert({
        where: {
          name: categoryName.trim()
        },
        update: {},
        create: {
          name: categoryName.trim()
        }
      });

      dataToUpdate.categoryId = category.id;
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: dataToUpdate,
      include: {
        category: true
      }
    });

    res.json({
      ok: true,
      message: "Producto actualizado correctamente",
      product: formatProduct(updatedProduct)
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al actualizar producto"
    });
  }
};

export const updateProductStock = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { stock } = req.body;

    const parsedStock = Number(stock);

    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({
        ok: false,
        message: "El stock debe ser un número mayor o igual a 0"
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado"
      });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        stock: parsedStock
      },
      include: {
        category: true
      }
    });

    res.json({
      ok: true,
      message: "Stock actualizado correctamente",
      product: formatProduct(updatedProduct)
    });
  } catch (error) {
    console.error("Error actualizando stock:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al actualizar stock"
    });
  }
};

export const toggleProductStatus = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado"
      });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        isActive: !existingProduct.isActive
      },
      include: {
        category: true
      }
    });

    res.json({
      ok: true,
      message: updatedProduct.isActive
        ? "Producto activado correctamente"
        : "Producto desactivado correctamente",
      product: formatProduct(updatedProduct)
    });
  } catch (error) {
    console.error("Error cambiando estado de producto:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al cambiar estado del producto"
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId
      },
      include: {
        category: true
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado"
      });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        isActive: false
      },
      include: {
        category: true
      }
    });

    res.json({
      ok: true,
      message: "Producto eliminado del catálogo correctamente",
      product: formatProduct(updatedProduct)
    });
  } catch (error) {
    console.error("Error eliminando producto:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al eliminar producto"
    });
  }
};
import { prisma } from "../config/prisma.js";

export const orderStatus = {
  PENDING: "pendiente",
  PAID: "pagado",
  PREPARING: "preparando",
  READY: "listo",
  DELIVERED: "entregado",
  CANCELLED: "cancelado"
};

const generateOrderNumber = async () => {
  const totalOrders = await prisma.order.count();
  const nextNumber = totalOrders + 1;
  return `KIO-${String(nextNumber).padStart(4, "0")}`;
};

const formatOrder = (order) => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal)
    })),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

const formatPublicOrder = (order) => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

const formatTicketOrder = (order) => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    items: order.items.map((item) => ({
      name: item.name,
      category: item.category,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal)
    })),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

export const createOrder = async (req, res) => {
  try {
    const { customerName, items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "El pedido debe tener al menos un producto"
      });
    }

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          ok: false,
          message: "La cantidad debe ser mayor a 0"
        });
      }

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
          message: `Producto con ID ${item.productId} no encontrado`
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          ok: false,
          message: `Stock insuficiente para ${product.name}`
        });
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        category: product.category.name,
        unitPrice,
        quantity,
        subtotal
      });

      total += subtotal;
    }

    const orderNumber = await generateOrderNumber();

    const newOrder = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        await tx.product.update({
          where: {
            id: item.productId
          },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      return tx.order.create({
        data: {
          orderNumber,
          customerName: customerName || "Cliente kiosko",
          total: Number(total.toFixed(2)),
          paymentMethod: paymentMethod || "pendiente",
          status: orderStatus.PENDING,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              category: item.category,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: Number(item.subtotal.toFixed(2))
            }))
          }
        },
        include: {
          items: true
        }
      });
    });

    res.status(201).json({
      ok: true,
      message: "Pedido creado correctamente",
      order: formatOrder(newOrder)
    });
  } catch (error) {
    console.error("Error creando pedido:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al crear pedido"
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      ok: true,
      total: orders.length,
      orders: orders.map(formatOrder)
    });
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener pedidos"
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "Pedido no encontrado"
      });
    }

    res.json({
      ok: true,
      order: formatOrder(order)
    });
  } catch (error) {
    console.error("Error obteniendo pedido:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener pedido"
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatus = Object.values(orderStatus);

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Estado de pedido no válido",
        allowedStatus
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        ok: false,
        message: "Pedido no encontrado"
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        status
      },
      include: {
        items: true
      }
    });

    res.json({
      ok: true,
      message: "Estado del pedido actualizado correctamente",
      order: formatOrder(updatedOrder)
    });
  } catch (error) {
    console.error("Error actualizando pedido:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al actualizar pedido"
    });
  }
};

export const getPublicOrderStatus = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: [orderStatus.PAID, orderStatus.PREPARING, orderStatus.READY]
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 30
    });

    const preparingOrders = orders.filter((order) =>
      [orderStatus.PAID, orderStatus.PREPARING].includes(order.status)
    );

    const readyOrders = orders.filter((order) => order.status === orderStatus.READY);

    res.json({
      ok: true,
      preparing: preparingOrders.map(formatPublicOrder),
      ready: readyOrders.map(formatPublicOrder),
      totalPreparing: preparingOrders.length,
      totalReady: readyOrders.length
    });
  } catch (error) {
    console.error("Error obteniendo estado público de pedidos:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener estado público de pedidos"
    });
  }
};

export const getPublicTicketByOrderNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({
        ok: false,
        message: "El número de pedido es obligatorio"
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        orderNumber: orderNumber.trim().toUpperCase()
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró un pedido con ese número"
      });
    }

    res.json({
      ok: true,
      ticket: formatTicketOrder(order)
    });
  } catch (error) {
    console.error("Error obteniendo ticket público:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener ticket"
    });
  }
};
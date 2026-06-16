import { prisma } from "../config/prisma.js";

export const orderStatus = {
  PENDING: "pendiente",
  PAID: "pagado",
  PREPARING: "preparando",
  READY: "listo",
  DELIVERED: "entregado",
  CANCELLED: "anulado"
};

const ORDER_STATUSES = Object.values(orderStatus);

const formatDecimal = (value) => {
  return Number(value);
};

const formatOrder = (order) => {
  return {
    ...order,
    total: formatDecimal(order.total),
    items: order.items?.map((item) => ({
      ...item,
      unitPrice: formatDecimal(item.unitPrice),
      subtotal: formatDecimal(item.subtotal)
    })) || [],
    payment: order.payment
      ? {
          ...order.payment,
          amount: formatDecimal(order.payment.amount)
        }
      : null
  };
};

const getUserActionData = (req) => {
  if (!req.user) {
    return {
      userId: null,
      userName: "Sistema",
      userRole: null
    };
  }

  return {
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role
  };
};

const registerOrderAction = async ({
  tx,
  orderId,
  req,
  action,
  previousStatus = null,
  newStatus = null,
  reason = null
}) => {
  const userData = getUserActionData(req);

  return tx.orderAction.create({
    data: {
      orderId,
      userId: userData.userId,
      userName: userData.userName,
      userRole: userData.userRole,
      action,
      previousStatus,
      newStatus,
      reason
    }
  });
};

const buildDateFilter = (date) => {
  if (!date) {
    return {};
  }

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  if (!isValidDate) {
    return {};
  }

  const startDate = new Date(`${date}T00:00:00.000-05:00`);
  const endDate = new Date(`${date}T23:59:59.999-05:00`);

  return {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };
};

const generateOrderNumber = async (tx) => {
  const totalOrders = await tx.order.count();
  let nextNumber = totalOrders + 1;
  let orderNumber = `KIO-${String(nextNumber).padStart(4, "0")}`;

  let existingOrder = await tx.order.findUnique({
    where: { orderNumber }
  });

  while (existingOrder) {
    nextNumber += 1;
    orderNumber = `KIO-${String(nextNumber).padStart(4, "0")}`;

    existingOrder = await tx.order.findUnique({
      where: { orderNumber }
    });
  }

  return orderNumber;
};

export const createOrder = async (req, res) => {
  try {
    const { customerName, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "El pedido debe tener al menos un producto"
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData = [];
      let total = 0;

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        if (!productId || !quantity || quantity <= 0) {
          throw new Error("Producto o cantidad inválida");
        }

        const product = await tx.product.findUnique({
          where: { id: productId },
          include: {
            category: true
          }
        });

        if (!product || !product.isActive) {
          throw new Error(`Producto no disponible: ${productId}`);
        }

        if (product.stock < quantity) {
          throw new Error(`Stock insuficiente para ${product.name}`);
        }

        const unitPrice = Number(product.price);
        const subtotal = unitPrice * quantity;

        total += subtotal;

        orderItemsData.push({
          productId: product.id,
          name: product.name,
          category: product.category.name,
          unitPrice,
          quantity,
          subtotal
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock - quantity
          }
        });
      }

      const orderNumber = await generateOrderNumber(tx);

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: customerName?.trim() || "Cliente kiosko",
          total,
          paymentMethod: "pendiente",
          status: "pendiente",
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true,
          payment: true
        }
      });

      await registerOrderAction({
        tx,
        orderId: createdOrder.id,
        req,
        action: "PEDIDO_CREADO",
        previousStatus: null,
        newStatus: "pendiente",
        reason: "Pedido generado desde el kiosko"
      });

      return createdOrder;
    });

    return res.status(201).json({
      ok: true,
      message: "Pedido creado correctamente",
      order: formatOrder(order)
    });
  } catch (error) {
    console.error("ERROR REAL CREANDO PEDIDO:", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "Error al crear pedido"
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { date, status } = req.query;

    const where = {
      ...buildDateFilter(date)
    };

    if (status && ORDER_STATUSES.includes(status)) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payment: true,
        actions: {
          orderBy: {
            createdAt: "desc"
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json({
      ok: true,
      filters: {
        date: date || null,
        status: status || null
      },
      orders: orders.map(formatOrder)
    });
  } catch (error) {
    console.error("ERROR REAL LISTANDO PEDIDOS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar pedidos"
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).json({
        ok: false,
        message: "ID de pedido inválido"
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        actions: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "Pedido no encontrado"
      });
    }

    return res.json({
      ok: true,
      order: formatOrder(order)
    });
  } catch (error) {
    console.error("ERROR REAL OBTENIENDO PEDIDO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener pedido"
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        ok: false,
        message: "ID de pedido inválido"
      });
    }

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Estado de pedido inválido"
      });
    }

    if (status === "anulado") {
      return res.status(400).json({
        ok: false,
        message: "Para anular un pedido usa la ruta específica de anulación"
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true
        }
      });

      if (!currentOrder) {
        throw new Error("Pedido no encontrado");
      }

      if (currentOrder.status === "anulado") {
        throw new Error("No se puede cambiar el estado de un pedido anulado");
      }

      if (currentOrder.status === "entregado") {
        throw new Error("No se puede cambiar el estado de un pedido entregado");
      }

      const previousStatus = currentOrder.status;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          items: true,
          payment: true
        }
      });

      await registerOrderAction({
        tx,
        orderId,
        req,
        action: "CAMBIO_ESTADO",
        previousStatus,
        newStatus: status,
        reason: reason?.trim() || null
      });

      return updatedOrder;
    });

    return res.json({
      ok: true,
      message: "Estado del pedido actualizado correctamente",
      order: formatOrder(order)
    });
  } catch (error) {
    console.error("ERROR REAL ACTUALIZANDO ESTADO:", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "Error al actualizar estado"
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        ok: false,
        message: "ID de pedido inválido"
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        ok: false,
        message: "El motivo de anulación es obligatorio"
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true
        }
      });

      if (!currentOrder) {
        throw new Error("Pedido no encontrado");
      }

      if (currentOrder.status === "anulado") {
        throw new Error("El pedido ya está anulado");
      }

      if (currentOrder.status === "entregado") {
        throw new Error("No se puede anular un pedido entregado");
      }

      const previousStatus = currentOrder.status;

      for (const item of currentOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "anulado"
        },
        include: {
          items: true,
          payment: true
        }
      });

      await registerOrderAction({
        tx,
        orderId,
        req,
        action: "PEDIDO_ANULADO",
        previousStatus,
        newStatus: "anulado",
        reason: reason.trim()
      });

      return updatedOrder;
    });

    return res.json({
      ok: true,
      message: "Pedido anulado correctamente",
      order: formatOrder(order)
    });
  } catch (error) {
    console.error("ERROR REAL ANULANDO PEDIDO:", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "Error al anular pedido"
    });
  }
};

export const getOrderActions = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).json({
        ok: false,
        message: "ID de pedido inválido"
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "Pedido no encontrado"
      });
    }

    const actions = await prisma.orderAction.findMany({
      where: { orderId },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json({
      ok: true,
      orderNumber: order.orderNumber,
      actions
    });
  } catch (error) {
    console.error("ERROR REAL LISTANDO HISTORIAL:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar historial del pedido"
    });
  }
};

export const getPublicOrderStatus = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ["pagado", "preparando", "listo"]
        }
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    const preparing = orders.filter((order) =>
      ["pagado", "preparando"].includes(order.status)
    );

    const ready = orders.filter((order) => order.status === "listo");

    return res.json({
      ok: true,
      orders,
      preparing,
      ready
    });
  } catch (error) {
    console.error("ERROR REAL EN PANTALLA PUBLICA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener estado público de pedidos"
    });
  }
};

export const getPublicTicketByOrderNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payment: true
      }
    });

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "Ticket no encontrado"
      });
    }

    return res.json({
      ok: true,
      ticket: formatOrder(order)
    });
  } catch (error) {
    console.error("ERROR REAL OBTENIENDO TICKET:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener ticket"
    });
  }
};
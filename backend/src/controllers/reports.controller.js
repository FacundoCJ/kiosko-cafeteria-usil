import { prisma } from "../config/prisma.js";

const VALID_SALE_STATUSES = ["pagado", "preparando", "listo", "entregado"];

const ORDER_STATUSES = [
  "pendiente",
  "pagado",
  "preparando",
  "listo",
  "entregado",
  "anulado"
];

const formatDecimal = (value) => {
  return Number(value || 0);
};

const getTodayDate = () => {
  const now = new Date();
  const peruDate = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return peruDate.toISOString().slice(0, 10);
};

const isValidDateFormat = (date) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
};

const buildDateRange = (date) => {
  const selectedDate = date && isValidDateFormat(date) ? date : getTodayDate();

  const startDate = new Date(`${selectedDate}T00:00:00.000-05:00`);
  const endDate = new Date(`${selectedDate}T23:59:59.999-05:00`);

  return {
    selectedDate,
    startDate,
    endDate
  };
};

const getOrdersByStatus = (orders) => {
  const result = {};

  for (const status of ORDER_STATUSES) {
    result[status] = 0;
  }

  for (const order of orders) {
    result[order.status] = (result[order.status] || 0) + 1;
  }

  return result;
};

const getSalesByPaymentMethod = (orders) => {
  const result = {};

  for (const order of orders) {
    const method = order.paymentMethod || "pendiente";

    result[method] = (result[method] || 0) + formatDecimal(order.total);
  }

  return result;
};

const getProductsSoldSummary = (orders) => {
  const productMap = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const current = productMap.get(item.productId) || {
        productId: item.productId,
        name: item.name,
        category: item.category,
        quantity: 0,
        total: 0
      };

      current.quantity += Number(item.quantity || 0);
      current.total += formatDecimal(item.subtotal);

      productMap.set(item.productId, current);
    }
  }

  return Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
};

const formatOrder = (order) => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    paymentMethod: order.paymentMethod,
    total: formatDecimal(order.total),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      category: item.category,
      unitPrice: formatDecimal(item.unitPrice),
      quantity: item.quantity,
      subtotal: formatDecimal(item.subtotal)
    }))
  };
};

export const getSummaryReport = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        payment: true
      }
    });

    const products = await prisma.product.findMany();

    const validSalesOrders = orders.filter((order) =>
      VALID_SALE_STATUSES.includes(order.status)
    );

    const totalSales = validSalesOrders.reduce(
      (sum, order) => sum + formatDecimal(order.total),
      0
    );

    const totalProductsSold = validSalesOrders.reduce((sum, order) => {
      return (
        sum +
        (order.items || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        )
      );
    }, 0);

    const lowStockProducts = products.filter(
      (product) => product.stock <= 5 && product.isActive
    ).length;

    return res.json({
      ok: true,
      summary: {
        totalOrders: orders.length,
        paidOrders: validSalesOrders.length,
        deliveredOrders: orders.filter((order) => order.status === "entregado")
          .length,
        pendingOrders: orders.filter((order) => order.status === "pendiente")
          .length,
        cancelledOrders: orders.filter((order) => order.status === "anulado")
          .length,
        totalSales,
        averageTicket:
          validSalesOrders.length > 0 ? totalSales / validSalesOrders.length : 0,
        totalProductsSold,
        totalProducts: products.length,
        activeProducts: products.filter((product) => product.isActive).length,
        inactiveProducts: products.filter((product) => !product.isActive).length,
        lowStockProducts,
        salesByPaymentMethod: getSalesByPaymentMethod(validSalesOrders),
        ordersByStatus: getOrdersByStatus(orders)
      }
    });
  } catch (error) {
    console.error("ERROR REAL EN REPORTE RESUMEN:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al generar reporte resumen"
    });
  }
};

export const getTopProductsReport = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: VALID_SALE_STATUSES
        }
      },
      include: {
        items: true
      }
    });

    const topProducts = getProductsSoldSummary(orders).slice(0, 10);

    return res.json({
      ok: true,
      topProducts
    });
  } catch (error) {
    console.error("ERROR REAL EN REPORTE TOP PRODUCTOS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al generar reporte de productos más vendidos"
    });
  }
};

export const getSalesByDayReport = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: VALID_SALE_STATUSES
        }
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    const dayMap = new Map();

    for (const order of orders) {
      const dateKey = new Date(order.createdAt).toISOString().slice(0, 10);

      const current = dayMap.get(dateKey) || {
        date: dateKey,
        totalOrders: 0,
        totalSales: 0,
        totalProductsSold: 0
      };

      current.totalOrders += 1;
      current.totalSales += formatDecimal(order.total);
      current.totalProductsSold += (order.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      dayMap.set(dateKey, current);
    }

    return res.json({
      ok: true,
      salesByDay: Array.from(dayMap.values())
    });
  } catch (error) {
    console.error("ERROR REAL EN REPORTE VENTAS POR DIA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al generar reporte de ventas por día"
    });
  }
};

export const getDailyCloseReport = async (req, res) => {
  try {
    const { date } = req.query;
    const { selectedDate, startDate, endDate } = buildDateRange(date);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: true,
        payment: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    const validSalesOrders = orders.filter((order) =>
      VALID_SALE_STATUSES.includes(order.status)
    );

    const cancelledOrders = orders.filter((order) => order.status === "anulado");

    const totalSales = validSalesOrders.reduce(
      (sum, order) => sum + formatDecimal(order.total),
      0
    );

    const totalProductsSold = validSalesOrders.reduce((sum, order) => {
      return (
        sum +
        (order.items || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        )
      );
    }, 0);

    const productsSold = getProductsSoldSummary(validSalesOrders);
    const ordersByStatus = getOrdersByStatus(orders);
    const salesByPaymentMethod = getSalesByPaymentMethod(validSalesOrders);

    return res.json({
      ok: true,
      dailyClose: {
        date: selectedDate,
        generatedAt: new Date(),
        totals: {
          totalOrders: orders.length,
          validSalesOrders: validSalesOrders.length,
          cancelledOrders: cancelledOrders.length,
          pendingOrders: ordersByStatus.pendiente || 0,
          paidOrders: ordersByStatus.pagado || 0,
          preparingOrders: ordersByStatus.preparando || 0,
          readyOrders: ordersByStatus.listo || 0,
          deliveredOrders: ordersByStatus.entregado || 0,
          totalSales,
          averageTicket:
            validSalesOrders.length > 0
              ? totalSales / validSalesOrders.length
              : 0,
          totalProductsSold
        },
        ordersByStatus,
        salesByPaymentMethod,
        productsSold,
        orders: orders.map(formatOrder)
      }
    });
  } catch (error) {
    console.error("ERROR REAL EN CIERRE DE DIA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al generar cierre de día"
    });
  }
};
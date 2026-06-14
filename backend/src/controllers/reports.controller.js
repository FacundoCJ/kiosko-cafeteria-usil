import { prisma } from "../config/prisma.js";

const formatCurrency = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

const getDateRange = (req) => {
  const { from, to } = req.query;

  const where = {};

  if (from || to) {
    where.createdAt = {};

    if (from) {
      where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    }

    if (to) {
      where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }
  }

  return where;
};

export const getSummaryReport = async (req, res) => {
  try {
    const dateFilter = getDateRange(req);

    const orders = await prisma.order.findMany({
      where: dateFilter,
      include: {
        items: true,
        payment: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const payments = await prisma.payment.findMany({
      where: dateFilter,
      orderBy: {
        createdAt: "desc"
      }
    });

    const products = await prisma.product.findMany({
      include: {
        category: true
      }
    });

    const paidOrders = orders.filter((order) =>
      ["pagado", "preparando", "listo", "entregado"].includes(order.status)
    );

    const deliveredOrders = orders.filter((order) => order.status === "entregado");
    const pendingOrders = orders.filter((order) =>
      ["pagado", "preparando", "listo"].includes(order.status)
    );

    const totalSales = paidOrders.reduce((sum, order) => {
      return sum + Number(order.total);
    }, 0);

    const totalProductsSold = paidOrders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce((itemsSum, item) => {
          return itemsSum + item.quantity;
        }, 0)
      );
    }, 0);

    const averageTicket =
      paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

    const lowStockProducts = products.filter((product) => product.stock <= 5);

    const salesByPaymentMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || "sin método";
      acc[method] = formatCurrency((acc[method] || 0) + Number(payment.amount));
      return acc;
    }, {});

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const activeProducts = products.filter((product) => product.isActive);
    const inactiveProducts = products.filter((product) => !product.isActive);

    res.json({
      ok: true,
      summary: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        deliveredOrders: deliveredOrders.length,
        pendingOrders: pendingOrders.length,
        totalSales: formatCurrency(totalSales),
        averageTicket: formatCurrency(averageTicket),
        totalProductsSold,
        totalProducts: products.length,
        activeProducts: activeProducts.length,
        inactiveProducts: inactiveProducts.length,
        lowStockProducts: lowStockProducts.length,
        salesByPaymentMethod,
        ordersByStatus
      }
    });
  } catch (error) {
    console.error("Error generando reporte resumen:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al generar reporte resumen"
    });
  }
};

export const getTopProductsReport = async (req, res) => {
  try {
    const dateFilter = getDateRange(req);

    const orders = await prisma.order.findMany({
      where: {
        ...dateFilter,
        status: {
          in: ["pagado", "preparando", "listo", "entregado"]
        }
      },
      include: {
        items: true
      }
    });

    const productMap = new Map();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productMap.get(item.productId) || {
          productId: item.productId,
          name: item.name,
          category: item.category,
          quantitySold: 0,
          totalSales: 0
        };

        current.quantitySold += item.quantity;
        current.totalSales += Number(item.subtotal);

        productMap.set(item.productId, current);
      });
    });

    const topProducts = Array.from(productMap.values())
      .map((product) => ({
        ...product,
        totalSales: formatCurrency(product.totalSales)
      }))
      .sort((a, b) => {
        if (b.quantitySold === a.quantitySold) {
          return b.totalSales - a.totalSales;
        }

        return b.quantitySold - a.quantitySold;
      });

    res.json({
      ok: true,
      total: topProducts.length,
      products: topProducts
    });
  } catch (error) {
    console.error("Error generando reporte de productos:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al generar reporte de productos"
    });
  }
};

export const getSalesByDayReport = async (req, res) => {
  try {
    const dateFilter = getDateRange(req);

    const payments = await prisma.payment.findMany({
      where: dateFilter,
      orderBy: {
        createdAt: "asc"
      }
    });

    const salesMap = new Map();

    payments.forEach((payment) => {
      const day = payment.createdAt.toISOString().slice(0, 10);

      const current = salesMap.get(day) || {
        date: day,
        totalSales: 0,
        payments: 0
      };

      current.totalSales += Number(payment.amount);
      current.payments += 1;

      salesMap.set(day, current);
    });

    const salesByDay = Array.from(salesMap.values()).map((day) => ({
      ...day,
      totalSales: formatCurrency(day.totalSales)
    }));

    res.json({
      ok: true,
      total: salesByDay.length,
      salesByDay
    });
  } catch (error) {
    console.error("Error generando reporte de ventas por día:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al generar reporte de ventas por día"
    });
  }
};
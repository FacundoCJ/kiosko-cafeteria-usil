import { prisma } from "../config/prisma.js";
import { orderStatus } from "./orders.controller.js";

export const paymentStatus = {
  APPROVED: "aprobado",
  REJECTED: "rechazado"
};

export const paymentMethods = {
  YAPE: "yape",
  PLIN: "plin",
  CARD: "tarjeta",
  QR: "qr"
};

const generateTransactionId = async () => {
  const totalPayments = await prisma.payment.count();
  const nextNumber = totalPayments + 1;
  return `PAY-${String(nextNumber).padStart(6, "0")}`;
};

const formatPayment = (payment) => {
  return {
    id: payment.id,
    transactionId: payment.transactionId,
    orderId: payment.orderId,
    orderNumber: payment.orderNumber,
    paymentMethod: payment.paymentMethod,
    amount: Number(payment.amount),
    status: payment.status,
    createdAt: payment.createdAt
  };
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

export const simulatePayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId) {
      return res.status(400).json({
        ok: false,
        message: "El ID del pedido es obligatorio"
      });
    }

    const allowedMethods = Object.values(paymentMethods);

    if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        ok: false,
        message: "Método de pago no válido",
        allowedMethods
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: Number(orderId)
      },
      include: {
        items: true,
        payment: true
      }
    });

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "Pedido no encontrado"
      });
    }

    if (order.status === orderStatus.PAID || order.payment) {
      return res.status(400).json({
        ok: false,
        message: "Este pedido ya fue pagado"
      });
    }

    if (
      order.status === orderStatus.PREPARING ||
      order.status === orderStatus.READY ||
      order.status === orderStatus.DELIVERED
    ) {
      return res.status(400).json({
        ok: false,
        message: `No se puede pagar un pedido con estado: ${order.status}`
      });
    }

    const transactionId = await generateTransactionId();

    const result = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          transactionId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentMethod,
          amount: order.total,
          status: paymentStatus.APPROVED
        }
      });

      const updatedOrder = await tx.order.update({
        where: {
          id: order.id
        },
        data: {
          paymentMethod,
          status: orderStatus.PAID
        },
        include: {
          items: true
        }
      });

      return {
        payment: newPayment,
        order: updatedOrder
      };
    });

    res.status(201).json({
      ok: true,
      message: "Pago simulado aprobado correctamente",
      payment: formatPayment(result.payment),
      order: formatOrder(result.order)
    });
  } catch (error) {
    console.error("Error simulando pago:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al procesar pago"
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      ok: true,
      total: payments.length,
      payments: payments.map(formatPayment)
    });
  } catch (error) {
    console.error("Error obteniendo pagos:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener pagos"
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const paymentId = Number(req.params.id);

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId
      }
    });

    if (!payment) {
      return res.status(404).json({
        ok: false,
        message: "Pago no encontrado"
      });
    }

    res.json({
      ok: true,
      payment: formatPayment(payment)
    });
  } catch (error) {
    console.error("Error obteniendo pago:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener pago"
    });
  }
};
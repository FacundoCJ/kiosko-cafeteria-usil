import { orders, orderStatus } from "../database/orders.data.js";
import {
  payments,
  paymentStatus,
  paymentMethods
} from "../database/payments.data.js";

const generateTransactionId = () => {
  const nextNumber = payments.length + 1;
  return `PAY-${String(nextNumber).padStart(6, "0")}`;
};

export const simulatePayment = (req, res) => {
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

  const order = orders.find((orderItem) => orderItem.id === Number(orderId));

  if (!order) {
    return res.status(404).json({
      ok: false,
      message: "Pedido no encontrado"
    });
  }

  if (order.status === orderStatus.PAID) {
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

  const newPayment = {
    id: payments.length + 1,
    transactionId: generateTransactionId(),
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentMethod,
    amount: order.total,
    status: paymentStatus.APPROVED,
    createdAt: new Date().toISOString()
  };

  payments.push(newPayment);

  order.paymentMethod = paymentMethod;
  order.status = orderStatus.PAID;
  order.updatedAt = new Date().toISOString();

  res.status(201).json({
    ok: true,
    message: "Pago simulado aprobado correctamente",
    payment: newPayment,
    order
  });
};

export const getPayments = (req, res) => {
  res.json({
    ok: true,
    total: payments.length,
    payments
  });
};

export const getPaymentById = (req, res) => {
  const paymentId = Number(req.params.id);

  const payment = payments.find((paymentItem) => paymentItem.id === paymentId);

  if (!payment) {
    return res.status(404).json({
      ok: false,
      message: "Pago no encontrado"
    });
  }

  res.json({
    ok: true,
    payment
  });
};
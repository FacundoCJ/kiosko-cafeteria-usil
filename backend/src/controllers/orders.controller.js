import { orders, orderStatus } from "../database/orders.data.js";
import { products } from "../database/products.data.js";

const generateOrderNumber = () => {
  const nextNumber = orders.length + 1;
  return `KIO-${String(nextNumber).padStart(4, "0")}`;
};

export const createOrder = (req, res) => {
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
    const product = products.find((productItem) => productItem.id === Number(item.productId));

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: `Producto con ID ${item.productId} no encontrado`
      });
    }

    const quantity = Number(item.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        ok: false,
        message: "La cantidad debe ser mayor a 0"
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        ok: false,
        message: `Stock insuficiente para ${product.name}`
      });
    }

    const subtotal = product.price * quantity;

    orderItems.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      unitPrice: product.price,
      quantity,
      subtotal
    });

    total += subtotal;
  }

  for (const item of orderItems) {
    const product = products.find((productItem) => productItem.id === item.productId);
    product.stock -= item.quantity;
  }

  const newOrder = {
    id: orders.length + 1,
    orderNumber: generateOrderNumber(),
    customerName: customerName || "Cliente kiosko",
    items: orderItems,
    total: Number(total.toFixed(2)),
    paymentMethod: paymentMethod || "pendiente",
    status: orderStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(newOrder);

  res.status(201).json({
    ok: true,
    message: "Pedido creado correctamente",
    order: newOrder
  });
};

export const getOrders = (req, res) => {
  res.json({
    ok: true,
    total: orders.length,
    orders
  });
};

export const getOrderById = (req, res) => {
  const orderId = Number(req.params.id);

  const order = orders.find((orderItem) => orderItem.id === orderId);

  if (!order) {
    return res.status(404).json({
      ok: false,
      message: "Pedido no encontrado"
    });
  }

  res.json({
    ok: true,
    order
  });
};

export const updateOrderStatus = (req, res) => {
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

  const order = orders.find((orderItem) => orderItem.id === orderId);

  if (!order) {
    return res.status(404).json({
      ok: false,
      message: "Pedido no encontrado"
    });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  res.json({
    ok: true,
    message: "Estado del pedido actualizado correctamente",
    order
  });
};
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Ticket from "./pages/Ticket.jsx";

import Login from "./pages/Login.jsx";
import Reports from "./pages/Reports.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import OrderDisplay from "./pages/OrderDisplay.jsx";
import ProductManagement from "./pages/ProductManagement.jsx";
import UserManagement from "./pages/UserManagement.jsx";

import {
  getAuthHeaders,
  getCurrentUser,
  isAuthenticated,
  logout
} from "./services/auth.service.js";

const API_URL = "/api";

const COLORS = {
  primary: "#0B2E6B",
  primaryLight: "#EAF1FF",
  secondary: "#1E4FA8",
  white: "#FFFFFF",
  background: "#F5F7FB",
  text: "#162033",
  textSoft: "#5B6780",
  border: "#D7E1F2",
  success: "#1F9D55",
  danger: "#D72638",
  warning: "#F4B400"
};

function Root() {
  const currentPath = window.location.pathname;
  const currentUser = getCurrentUser();

  const getDefaultPanelByRole = (role) => {
    if (role === "ADMIN") return "/admin";
    if (role === "CAFETERIA") return "/admin/pedidos";
    if (role === "COCINA") return "/admin/pedidos";
    return "/";
  };

  const protectRoute = (Component, allowedRoles) => {
    if (!isAuthenticated()) {
      window.location.href = "/login";
      return null;
    }

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return (
        <Unauthorized
          suggestedPath={getDefaultPanelByRole(currentUser?.role)}
          suggestedLabel="Ir a mi panel"
        />
      );
    }

    return <Component />;
  };

if (currentPath.startsWith("/ticket/")) {
  return <Ticket />;
}
  
  if (currentPath.startsWith("/pantalla-pedidos")) {
    return <OrderDisplay />;
  }

  if (currentPath.startsWith("/login")) {
    if (isAuthenticated()) {
      window.location.href = getDefaultPanelByRole(currentUser?.role);
      return null;
    }

    return <Login />;
  }

  if (currentPath.startsWith("/admin/usuarios")) {
    return protectRoute(UserManagement, ["ADMIN"]);
  }

  if (currentPath.startsWith("/admin/reportes")) {
    return protectRoute(Reports, ["ADMIN", "CAFETERIA"]);
  }

  if (currentPath.startsWith("/admin/productos")) {
    return protectRoute(ProductManagement, ["ADMIN", "CAFETERIA"]);
  }

  if (currentPath.startsWith("/admin/pedidos")) {
    return protectRoute(AdminPanel, ["ADMIN", "CAFETERIA", "COCINA"]);
  }

  if (currentPath === "/admin" || currentPath === "/admin/") {
    return protectRoute(AdminPanel, ["ADMIN"]);
  }

  return <KioskApp />;
}

function KioskApp() {
  const [screen, setScreen] = useState("welcome");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("yape");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar productos");
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      setMessage("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category))];
  }, [products]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1
        }
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearOrder = () => {
    setCart([]);
    setPaymentMethod("yape");
    setCreatedOrder(null);
    setMessage("");
    setScreen("menu");
    loadProducts();
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      setMessage("Agrega productos al carrito antes de pagar.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const orderResponse = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName: "Cliente kiosko",
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || "No se pudo crear el pedido");
      }

      const paymentResponse = await fetch(`${API_URL}/payments/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: orderData.order.id,
          paymentMethod
        })
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || "No se pudo procesar el pago");
      }

      setCreatedOrder(paymentData.order);
      setCart([]);
      setScreen("confirmation");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al procesar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (screen === "welcome") {
    return (
      <main style={kioskStyles.page}>
        <section style={kioskStyles.welcomeCard}>
          <div style={kioskStyles.logo}>USIL</div>

          <h1 style={kioskStyles.welcomeTitle}>Kiosko Cafetería USIL</h1>

          <p style={kioskStyles.welcomeSubtitle}>
            Realiza tu pedido de forma rápida, segura y autónoma.
          </p>

          <div style={kioskStyles.steps}>
            <div style={kioskStyles.step}>1. Elige tus productos</div>
            <div style={kioskStyles.step}>2. Confirma tu carrito</div>
            <div style={kioskStyles.step}>3. Simula el pago</div>
            <div style={kioskStyles.step}>4. Retira tu pedido</div>
          </div>

          <button
            style={kioskStyles.startButton}
            onClick={() => setScreen("menu")}
          >
            Iniciar pedido
          </button>
        </section>
      </main>
    );
  }

  if (screen === "confirmation") {
    return (
      <main style={kioskStyles.page}>
        <section style={kioskStyles.confirmationCard}>
          <div style={kioskStyles.successIcon}>✓</div>

          <h1 style={kioskStyles.welcomeTitle}>Pedido confirmado</h1>

          <p style={kioskStyles.welcomeSubtitle}>
            Tu pedido fue registrado y enviado a cafetería.
          </p>

          {createdOrder && (
            <div style={kioskStyles.ticketBox}>
              <strong>Número de pedido</strong>
              <span style={kioskStyles.orderNumber}>
                {createdOrder.orderNumber}
              </span>
              <span>Total: S/ {createdOrder.total.toFixed(2)}</span>
              <span>Pago: {createdOrder.paymentMethod}</span>
              <span>Estado: {createdOrder.status}</span>
            </div>
          )}

          <div style={kioskStyles.confirmationActions}>
  {createdOrder && (
    <a
      href={`/ticket/${createdOrder.orderNumber}`}
      style={kioskStyles.ticketButton}
    >
      Ver comprobante
    </a>
  )}

  <button style={kioskStyles.startButton} onClick={clearOrder}>
    Realizar otro pedido
  </button>
</div>
        </section>
      </main>
    );
  }

  return (
    <main style={kioskStyles.menuPage}>
      <header style={kioskStyles.header}>
        <div>
          <div style={kioskStyles.logoSmall}>USIL</div>

          <h1 style={kioskStyles.menuTitle}>Catálogo de cafetería</h1>

          <p style={kioskStyles.menuSubtitle}>
            Selecciona tus productos y confirma tu pedido.
          </p>
        </div>
      </header>

      {message && <p style={kioskStyles.message}>{message}</p>}

      <section style={kioskStyles.menuLayout}>
        <section style={kioskStyles.productsArea}>
          {loading && <p>Cargando productos...</p>}

          {categories.map((category) => (
            <div key={category} style={kioskStyles.categoryBlock}>
              <h2 style={kioskStyles.categoryTitle}>{category}</h2>

              <div style={kioskStyles.productGrid}>
                {products
                  .filter((product) => product.category === category)
                  .map((product) => (
                    <article key={product.id} style={kioskStyles.productCard}>
                      <div style={kioskStyles.productIcon}>
                        {getProductEmoji(product.image)}
                      </div>

                      <h3 style={kioskStyles.productName}>{product.name}</h3>

                      <p style={kioskStyles.productDescription}>
                        {product.description}
                      </p>

                      <div style={kioskStyles.productBottom}>
                        <strong>S/ {product.price.toFixed(2)}</strong>
                        <span>Stock: {product.stock}</span>
                      </div>

                      <button
                        style={kioskStyles.addButton}
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock <= 0 ? "Sin stock" : "Agregar"}
                      </button>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <aside style={kioskStyles.cartPanel}>
          <h2 style={kioskStyles.cartTitle}>Tu pedido</h2>

          {cart.length === 0 ? (
            <p style={kioskStyles.emptyCart}>Aún no agregaste productos.</p>
          ) : (
            <div style={kioskStyles.cartList}>
              {cart.map((item) => (
                <div key={item.id} style={kioskStyles.cartItem}>
                  <div>
                    <strong>{item.name}</strong>

                    <span style={kioskStyles.cartDetail}>
                      S/ {item.price.toFixed(2)} x {item.quantity}
                    </span>
                  </div>

                  <div style={kioskStyles.cartActions}>
                    <button
                      style={kioskStyles.quantityButton}
                      onClick={() => removeFromCart(item.id)}
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      style={kioskStyles.quantityButton}
                      onClick={() => addToCart(item)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={kioskStyles.totalBox}>
            <span>Total</span>
            <strong>S/ {total.toFixed(2)}</strong>
          </div>

          <div style={kioskStyles.paymentBox}>
            <label style={kioskStyles.paymentLabel}>
              Método de pago
              <select
                style={kioskStyles.paymentSelect}
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="qr">QR</option>
              </select>
            </label>
          </div>

          <button
            style={kioskStyles.payButton}
            onClick={processPayment}
            disabled={loading || cart.length === 0}
          >
            {loading ? "Procesando..." : "Pagar y enviar pedido"}
          </button>
        </aside>
      </section>
    </main>
  );
}

function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUser = getCurrentUser();

  const canManageUsers = currentUser?.role === "ADMIN";
  const canManageProducts = ["ADMIN", "CAFETERIA"].includes(currentUser?.role);
  const canViewReports = ["ADMIN", "CAFETERIA"].includes(currentUser?.role);
  const canDeliverOrders = ["ADMIN", "CAFETERIA"].includes(currentUser?.role);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/orders`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los pedidos");
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el pedido");
      }

      setMessage(`Pedido ${data.order.orderNumber} actualizado a ${newStatus}.`);
      await loadOrders();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al actualizar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const paidOrders = orders.filter((order) => order.status === "pagado");
  const preparingOrders = orders.filter((order) => order.status === "preparando");
  const readyOrders = orders.filter((order) => order.status === "listo");
  const deliveredOrders = orders.filter((order) => order.status === "entregado");

  const salesTotal = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <main style={adminStyles.page}>
      <header style={adminStyles.header}>
        <div>
          <div style={adminStyles.logo}>USIL</div>

          <h1 style={adminStyles.title}>Panel de cafetería</h1>

          <p style={adminStyles.subtitle}>
            Gestiona pedidos, preparación y entrega.
          </p>
        </div>

        <div style={adminStyles.headerActions}>
          {canManageUsers && (
            <a href="/admin/usuarios" style={adminStyles.linkButton}>
              Usuarios
            </a>
          )}

          {canViewReports && (
            <a href="/admin/reportes" style={adminStyles.linkButton}>
              Reportes
            </a>
          )}

          {canManageProducts && (
            <a href="/admin/productos" style={adminStyles.linkButton}>
              Gestionar productos
            </a>
          )}

          <a href="/pantalla-pedidos" style={adminStyles.linkButton}>
            Pantalla retiro
          </a>

          <a href="/" style={adminStyles.linkButton}>
            Ir al kiosko
          </a>

          <button style={adminStyles.refreshButton} onClick={loadOrders}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={adminStyles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={adminStyles.metrics}>
        <article style={adminStyles.metricCard}>
          <span>Pedidos</span>
          <strong>{orders.length}</strong>
        </article>

        <article style={adminStyles.metricCard}>
          <span>Pendientes</span>
          <strong>{paidOrders.length + preparingOrders.length}</strong>
        </article>

        <article style={adminStyles.metricCard}>
          <span>Listos</span>
          <strong>{readyOrders.length}</strong>
        </article>

        <article style={adminStyles.metricCard}>
          <span>Ventas</span>
          <strong>S/ {salesTotal.toFixed(2)}</strong>
        </article>
      </section>

      {message && <p style={adminStyles.message}>{message}</p>}

      <section style={adminStyles.columns}>
        <OrderColumn
          title="Pagados"
          orders={paidOrders}
          actionLabel="Preparar"
          onAction={(orderId) => updateOrderStatus(orderId, "preparando")}
        />

        <OrderColumn
          title="En preparación"
          orders={preparingOrders}
          actionLabel="Marcar listo"
          onAction={(orderId) => updateOrderStatus(orderId, "listo")}
        />

        <OrderColumn
          title="Listos"
          orders={readyOrders}
          actionLabel={canDeliverOrders ? "Entregar" : "Esperando entrega"}
          onAction={
            canDeliverOrders
              ? (orderId) => updateOrderStatus(orderId, "entregado")
              : null
          }
        />

        <OrderColumn
          title="Entregados"
          orders={deliveredOrders}
          actionLabel="Finalizado"
          onAction={null}
        />
      </section>
    </main>
  );
}

function OrderColumn({ title, orders, actionLabel, onAction }) {
  return (
    <section style={adminStyles.column}>
      <h2 style={adminStyles.columnTitle}>{title}</h2>

      {orders.length === 0 ? (
        <p style={adminStyles.emptyColumn}>Sin pedidos.</p>
      ) : (
        orders.map((order) => (
          <article key={order.id} style={adminStyles.orderCard}>
            <div style={adminStyles.orderHeader}>
              <strong>{order.orderNumber}</strong>
              <span>S/ {order.total.toFixed(2)}</span>
            </div>

            <p style={adminStyles.orderClient}>{order.customerName}</p>

            <ul style={adminStyles.itemList}>
              {order.items.map((item, index) => (
                <li key={`${order.id}-${index}`}>
                  {item.quantity}x {item.name}
                </li>
              ))}
            </ul>

            <p style={adminStyles.paymentText}>Pago: {order.paymentMethod}</p>

            {onAction ? (
              <button
                style={adminStyles.orderButton}
                onClick={() => onAction(order.id)}
              >
                {actionLabel}
              </button>
            ) : (
              <span style={adminStyles.finishedBadge}>{actionLabel}</span>
            )}
          </article>
        ))
      )}
    </section>
  );
}

function getProductEmoji(image) {
  const emojis = {
    coffee: "☕",
    cappuccino: "🥤",
    juice: "🍊",
    sandwich: "🥪",
    empanada: "🥟",
    menu: "🍽️",
    brownie: "🍫",
    water: "💧",
    food: "🍴"
  };

  return emojis[image] || "🍴";
}

const kioskStyles = {
  page: {
    minHeight: "100vh",
    background: COLORS.background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
    color: COLORS.text
  },
  welcomeCard: {
    maxWidth: "760px",
    background: COLORS.white,
    borderRadius: "34px",
    padding: "42px",
    textAlign: "center",
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)"
  },
  confirmationCard: {
    maxWidth: "660px",
    background: COLORS.white,
    borderRadius: "34px",
    padding: "42px",
    textAlign: "center",
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)"
  },
  logo: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "28px",
    fontWeight: "900"
  },
  logoSmall: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "900",
    marginBottom: "12px"
  },
  welcomeTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "46px"
  },
  welcomeSubtitle: {
    margin: "12px 0 0",
    color: COLORS.textSoft,
    fontSize: "20px"
  },
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "14px",
    margin: "30px 0"
  },
  step: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "18px",
    padding: "18px",
    fontWeight: "800"
  },
  confirmationActions: {
  display: "grid",
  gap: "14px"
},
ticketButton: {
  background: COLORS.success,
  color: COLORS.white,
  border: "none",
  borderRadius: "999px",
  padding: "18px 36px",
  fontSize: "20px",
  fontWeight: "900",
  cursor: "pointer",
  textDecoration: "none"
},
  startButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "18px 36px",
    fontSize: "20px",
    fontWeight: "900",
    cursor: "pointer"
  },
  menuPage: {
    minHeight: "100vh",
    background: COLORS.background,
    padding: "32px",
    fontFamily: "Arial, sans-serif",
    color: COLORS.text
  },
  header: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)"
  },
  menuTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "42px"
  },
  menuSubtitle: {
    margin: "8px 0 0",
    color: COLORS.textSoft,
    fontSize: "18px"
  },
  message: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px 18px",
    fontWeight: "800"
  },
  menuLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "24px",
    alignItems: "start"
  },
  productsArea: {
    display: "grid",
    gap: "28px"
  },
  categoryBlock: {
    display: "grid",
    gap: "14px"
  },
  categoryTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "28px"
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px"
  },
  productCard: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "20px",
    display: "grid",
    gap: "12px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  productIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    background: COLORS.primaryLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px"
  },
  productName: {
    margin: 0,
    color: COLORS.text,
    fontSize: "22px"
  },
  productDescription: {
    margin: 0,
    color: COLORS.textSoft,
    fontSize: "15px",
    lineHeight: 1.4
  },
  productBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: COLORS.primary
  },
  addButton: {
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "16px",
    padding: "13px",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer"
  },
  cartPanel: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    position: "sticky",
    top: "24px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)"
  },
  cartTitle: {
    margin: "0 0 16px",
    color: COLORS.primary,
    fontSize: "30px"
  },
  emptyCart: {
    color: COLORS.textSoft
  },
  cartList: {
    display: "grid",
    gap: "12px"
  },
  cartItem: {
    background: COLORS.background,
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px"
  },
  cartDetail: {
    display: "block",
    color: COLORS.textSoft,
    marginTop: "4px"
  },
  cartActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  quantityButton: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    background: COLORS.primary,
    color: COLORS.white,
    fontWeight: "900",
    cursor: "pointer"
  },
  totalBox: {
    marginTop: "18px",
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: "18px",
    display: "flex",
    justifyContent: "space-between",
    color: COLORS.primary,
    fontSize: "24px"
  },
  paymentBox: {
    marginTop: "18px"
  },
  paymentLabel: {
    display: "grid",
    gap: "8px",
    fontWeight: "800"
  },
  paymentSelect: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    fontSize: "16px"
  },
  payButton: {
    width: "100%",
    marginTop: "18px",
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "18px",
    padding: "17px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer"
  },
  successIcon: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    background: COLORS.success,
    color: COLORS.white,
    fontSize: "54px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px"
  },
  ticketBox: {
    margin: "28px auto",
    maxWidth: "340px",
    background: COLORS.primaryLight,
    borderRadius: "22px",
    padding: "22px",
    display: "grid",
    gap: "8px",
    color: COLORS.primary
  },
  orderNumber: {
    fontSize: "34px",
    fontWeight: "900"
  }
};

const adminStyles = {
  page: {
    minHeight: "100vh",
    background: COLORS.background,
    fontFamily: "Arial, sans-serif",
    padding: "32px",
    color: COLORS.text
  },
  header: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    marginBottom: "24px"
  },
  logo: {
    width: "74px",
    height: "74px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "900",
    marginBottom: "14px"
  },
  title: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "46px"
  },
  subtitle: {
    margin: "8px 0 0",
    color: COLORS.textSoft,
    fontSize: "18px"
  },
  headerActions: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  linkButton: {
    textDecoration: "none",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "14px 24px",
    fontWeight: "800",
    fontSize: "16px"
  },
  refreshButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "14px 24px",
    fontWeight: "800",
    fontSize: "16px",
    cursor: "pointer"
  },
  logoutButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "14px 24px",
    fontWeight: "800",
    fontSize: "16px",
    cursor: "pointer"
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "22px"
  },
  metricCard: {
    background: COLORS.white,
    borderRadius: "22px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    display: "grid",
    gap: "8px"
  },
  message: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px 18px",
    fontWeight: "800",
    marginBottom: "20px"
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    alignItems: "start"
  },
  column: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "24px",
    padding: "18px",
    minHeight: "420px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  columnTitle: {
    margin: "0 0 14px",
    color: COLORS.primary,
    fontSize: "24px"
  },
  emptyColumn: {
    color: COLORS.textSoft,
    background: COLORS.background,
    borderRadius: "16px",
    padding: "18px",
    textAlign: "center"
  },
  orderCard: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "14px"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: COLORS.primary,
    fontSize: "18px"
  },
  orderClient: {
    margin: "8px 0",
    color: COLORS.textSoft
  },
  itemList: {
    margin: "10px 0",
    paddingLeft: "20px"
  },
  paymentText: {
    color: COLORS.primary,
    fontWeight: "800"
  },
  orderButton: {
    width: "100%",
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "14px",
    padding: "12px",
    fontWeight: "900",
    cursor: "pointer"
  },
  finishedBadge: {
    display: "block",
    textAlign: "center",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "14px",
    padding: "12px",
    fontWeight: "900"
  }
};

createRoot(document.getElementById("root")).render(<Root />);
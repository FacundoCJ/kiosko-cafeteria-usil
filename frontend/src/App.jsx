import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const API_URL = "/api";

const COLORS = {
  primary: "#0B2E6B",
  primaryDark: "#081F49",
  primaryLight: "#EAF1FF",
  secondary: "#1E4FA8",
  white: "#FFFFFF",
  background: "#F5F7FB",
  surface: "#FFFFFF",
  text: "#162033",
  textSoft: "#5B6780",
  border: "#D7E1F2",
  success: "#1F9D55",
  warning: "#F4B400",
  danger: "#D72638",
  orange: "#EA7A1A"
};

function Root() {
  const currentPath = window.location.pathname;

  if (currentPath.startsWith("/admin")) {
    return <AdminPanel />;
  }

  return <KioskApp />;
}

function KioskApp() {
  const [screen, setScreen] = useState("welcome");
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [finalOrder, setFinalOrder] = useState(null);

  useEffect(() => {
    if (screen === "menu") {
      loadProducts();
    }
  }, [screen]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError("");

      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los productos");
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      setProductsError("No se pudo conectar con el catálogo de productos.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((product) => product.category))];
    return ["Todos", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Todos") return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((currentCart) => {
      const existingProduct = currentCart.find((item) => item.id === product.id);

      if (existingProduct) {
        if (existingProduct.quantity >= product.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });

    setCheckoutStep("cart");
    setPaymentError("");
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutStep("cart");
    setPaymentError("");
    setFinalOrder(null);
  };

  const goToPayment = () => {
    if (cart.length === 0) return;
    setCheckoutStep("payment");
    setPaymentError("");
  };

  const processPayment = async (paymentMethod) => {
    try {
      setPaymentLoading(true);
      setPaymentError("");

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

      setFinalOrder(paymentData.order);
      setCheckoutStep("success");
      setCart([]);
      loadProducts();
    } catch (error) {
      console.error(error);
      setPaymentError(error.message || "Ocurrió un error al procesar el pago");
    } finally {
      setPaymentLoading(false);
    }
  };

  const resetKiosk = () => {
    setScreen("welcome");
    setCart([]);
    setCheckoutStep("cart");
    setPaymentError("");
    setFinalOrder(null);
  };

  if (screen === "welcome") {
    return (
      <main style={styles.welcomePage}>
        <section style={styles.welcomeCard}>
          <div style={styles.logoBadge}>USIL</div>

          <h1 style={styles.welcomeTitle}>Kiosko Cafetería USIL</h1>

          <p style={styles.welcomeSubtitle}>
            Realiza tu pedido de forma rápida, cómoda y moderna desde el kiosko de autoservicio.
          </p>

          <div style={styles.welcomeInfoBox}>
            <div style={styles.welcomeInfoItem}>
              <span style={styles.welcomeInfoNumber}>1</span>
              <span>Elige tus productos</span>
            </div>

            <div style={styles.welcomeInfoItem}>
              <span style={styles.welcomeInfoNumber}>2</span>
              <span>Revisa tu pedido</span>
            </div>

            <div style={styles.welcomeInfoItem}>
              <span style={styles.welcomeInfoNumber}>3</span>
              <span>Continúa al pago</span>
            </div>
          </div>

          <button style={styles.startButton} onClick={() => setScreen("menu")}>
            Iniciar pedido
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.kioskPage}>
      <section style={styles.menuSection}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.menuTitle}>Elige tu pedido</h1>
            <p style={styles.menuSubtitle}>
              Selecciona productos del catálogo de la cafetería.
            </p>
          </div>

          <div style={styles.headerActions}>
            <a href="/admin" style={styles.adminShortcut}>
              Panel cafetería
            </a>

            <div style={styles.cartCounter}>
              {totalItems} producto{totalItems === 1 ? "" : "s"}
            </div>

            <button style={styles.exitButton} onClick={resetKiosk}>
              Salir
            </button>
          </div>
        </header>

        <nav style={styles.categoryBar}>
          {categories.map((category) => (
            <button
              key={category}
              style={{
                ...styles.categoryButton,
                ...(selectedCategory === category ? styles.categoryButtonActive : {})
              }}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>

        {loadingProducts ? (
          <section style={styles.feedbackBox}>
            <p style={styles.feedbackTitle}>Cargando productos...</p>
          </section>
        ) : productsError ? (
          <section style={styles.feedbackBox}>
            <p style={styles.feedbackTitle}>{productsError}</p>
            <button style={styles.retryButton} onClick={loadProducts}>
              Reintentar
            </button>
          </section>
        ) : filteredProducts.length === 0 ? (
          <section style={styles.feedbackBox}>
            <p style={styles.feedbackTitle}>No hay productos disponibles.</p>
          </section>
        ) : (
          <section style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <article key={product.id} style={styles.productCard}>
                <div style={styles.productTop}>
                  <div style={styles.productIcon}>
                    {getProductEmoji(product.image)}
                  </div>

                  <span style={styles.stockBadge}>
                    Stock: {product.stock}
                  </span>
                </div>

                <div>
                  <h2 style={styles.productName}>{product.name}</h2>
                  <p style={styles.productDescription}>{product.description}</p>
                </div>

                <div style={styles.productBottom}>
                  <strong style={styles.productPrice}>
                    S/ {product.price.toFixed(2)}
                  </strong>

                  <button
                    style={{
                      ...styles.addButton,
                      opacity: product.stock <= 0 ? 0.5 : 1,
                      cursor: product.stock <= 0 ? "not-allowed" : "pointer"
                    }}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock <= 0 ? "Agotado" : "Agregar"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      <aside style={styles.cartPanel}>
        {checkoutStep === "cart" && (
          <>
            <div>
              <h2 style={styles.cartTitle}>Tu pedido</h2>
              <p style={styles.cartSubtitle}>
                Revisa los productos seleccionados.
              </p>
            </div>

            {cart.length === 0 ? (
              <div style={styles.emptyCartBox}>
                <div style={styles.emptyCartIcon}>🛒</div>
                <p style={styles.emptyCartText}>Agrega productos para comenzar.</p>
              </div>
            ) : (
              <section style={styles.cartItems}>
                {cart.map((item) => (
                  <div key={item.id} style={styles.cartItem}>
                    <div style={styles.cartItemInfo}>
                      <strong style={styles.cartItemName}>{item.name}</strong>
                      <p style={styles.cartItemPrice}>
                        S/ {item.price.toFixed(2)} x {item.quantity}
                      </p>
                      <p style={styles.cartItemSubtotal}>
                        Subtotal: S/ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div style={styles.quantityControls}>
                      <button
                        style={styles.quantityButton}
                        onClick={() => removeFromCart(item.id)}
                      >
                        −
                      </button>

                      <span style={styles.quantityValue}>{item.quantity}</span>

                      <button
                        style={styles.quantityButton}
                        onClick={() => addToCart(item)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <CartFooter
              cart={cart}
              total={total}
              clearCart={clearCart}
              goToPayment={goToPayment}
            />
          </>
        )}

        {checkoutStep === "payment" && (
          <>
            <div>
              <h2 style={styles.cartTitle}>Método de pago</h2>
              <p style={styles.cartSubtitle}>
                Selecciona cómo deseas pagar tu pedido.
              </p>
            </div>

            <section style={styles.paymentBox}>
              <div style={styles.paymentTotalCard}>
                <span>Total a pagar</span>
                <strong>S/ {total.toFixed(2)}</strong>
              </div>

              <button
                style={styles.paymentMethodButton}
                onClick={() => processPayment("yape")}
                disabled={paymentLoading}
              >
                <span>📱</span>
                Pagar con Yape
              </button>

              <button
                style={styles.paymentMethodButton}
                onClick={() => processPayment("plin")}
                disabled={paymentLoading}
              >
                <span>💙</span>
                Pagar con Plin
              </button>

              <button
                style={styles.paymentMethodButton}
                onClick={() => processPayment("tarjeta")}
                disabled={paymentLoading}
              >
                <span>💳</span>
                Pagar con tarjeta
              </button>

              <button
                style={styles.paymentMethodButton}
                onClick={() => processPayment("qr")}
                disabled={paymentLoading}
              >
                <span>▦</span>
                Pagar con QR
              </button>

              {paymentLoading && (
                <p style={styles.paymentMessage}>Procesando pago...</p>
              )}

              {paymentError && (
                <p style={styles.paymentError}>{paymentError}</p>
              )}
            </section>

            <div style={styles.cartFooter}>
              <button
                style={styles.backButton}
                onClick={() => setCheckoutStep("cart")}
                disabled={paymentLoading}
              >
                Volver al pedido
              </button>
            </div>
          </>
        )}

        {checkoutStep === "success" && (
          <>
            <section style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>

              <h2 style={styles.successTitle}>Pedido confirmado</h2>

              <p style={styles.successText}>
                Tu pedido fue registrado y pagado correctamente.
              </p>

              <div style={styles.orderNumberBox}>
                <span>Número de pedido</span>
                <strong>{finalOrder?.orderNumber}</strong>
              </div>

              <p style={styles.successSmallText}>
                Espera a que tu pedido aparezca como listo en el panel de cafetería.
              </p>
            </section>

            <div style={styles.cartFooter}>
              <button style={styles.payButton} onClick={resetKiosk}>
                Finalizar
              </button>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}

function CartFooter({ cart, total, clearCart, goToPayment }) {
  return (
    <div style={styles.cartFooter}>
      <div style={styles.totalBox}>
        <span style={styles.totalLabel}>Total</span>
        <strong style={styles.totalAmount}>S/ {total.toFixed(2)}</strong>
      </div>

      <div style={styles.cartButtons}>
        <button
          style={{
            ...styles.clearButton,
            opacity: cart.length === 0 ? 0.5 : 1,
            cursor: cart.length === 0 ? "not-allowed" : "pointer"
          }}
          onClick={clearCart}
          disabled={cart.length === 0}
        >
          Limpiar
        </button>

        <button
          style={{
            ...styles.payButton,
            opacity: cart.length === 0 ? 0.5 : 1,
            cursor: cart.length === 0 ? "not-allowed" : "pointer"
          }}
          onClick={goToPayment}
          disabled={cart.length === 0}
        >
          Continuar al pago
        </button>
      </div>
    </div>
  );
}

function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const columns = [
    {
      title: "Pagados",
      status: "pagado",
      nextStatus: "preparando",
      buttonText: "Preparar",
      color: COLORS.secondary
    },
    {
      title: "En preparación",
      status: "preparando",
      nextStatus: "listo",
      buttonText: "Marcar listo",
      color: COLORS.orange
    },
    {
      title: "Listos",
      status: "listo",
      nextStatus: "entregado",
      buttonText: "Entregar",
      color: COLORS.success
    },
    {
      title: "Entregados",
      status: "entregado",
      nextStatus: null,
      buttonText: "Finalizado",
      color: COLORS.textSoft
    }
  ];

  const loadOrders = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/orders`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los pedidos");
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
      setMessage("No se pudo conectar con los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const visibleOrders = useMemo(() => {
    return orders.filter((order) =>
      ["pagado", "preparando", "listo", "entregado"].includes(order.status)
    );
  }, [orders]);

  const todaySales = useMemo(() => {
    return visibleOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [visibleOrders]);

  const pendingKitchenOrders = useMemo(() => {
    return visibleOrders.filter((order) =>
      ["pagado", "preparando", "listo"].includes(order.status)
    ).length;
  }, [visibleOrders]);

  const updateOrderStatus = async (orderId, status) => {
    if (!status) return;

    try {
      setMessage("");

      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el pedido");
      }

      setMessage(`Pedido ${data.order.orderNumber} actualizado a "${status}".`);
      loadOrders();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al actualizar el pedido.");
    }
  };

  return (
    <main style={adminStyles.page}>
      <header style={adminStyles.header}>
        <div>
          <div style={adminStyles.logo}>USIL</div>
          <h1 style={adminStyles.title}>Panel Cafetería</h1>
          <p style={adminStyles.subtitle}>
            Gestión de pedidos recibidos desde el kiosko de autoservicio.
          </p>
        </div>

        <div style={adminStyles.headerActions}>
          <a href="/" style={adminStyles.linkButton}>
            Ir al kiosko
          </a>

          <button style={adminStyles.refreshButton} onClick={loadOrders}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </header>

      <section style={adminStyles.metrics}>
        <article style={adminStyles.metricCard}>
          <span style={adminStyles.metricLabel}>Pedidos visibles</span>
          <strong style={adminStyles.metricValue}>{visibleOrders.length}</strong>
        </article>

        <article style={adminStyles.metricCard}>
          <span style={adminStyles.metricLabel}>Pendientes de atención</span>
          <strong style={adminStyles.metricValue}>{pendingKitchenOrders}</strong>
        </article>

        <article style={adminStyles.metricCard}>
          <span style={adminStyles.metricLabel}>Ventas registradas</span>
          <strong style={adminStyles.metricValue}>S/ {todaySales.toFixed(2)}</strong>
        </article>

        <article style={adminStyles.metricCard}>
          <span style={adminStyles.metricLabel}>Actualización</span>
          <strong style={adminStyles.metricSmallValue}>Cada 3 segundos</strong>
        </article>
      </section>

      {message && <p style={adminStyles.message}>{message}</p>}

      <section style={adminStyles.board}>
        {columns.map((column) => {
          const columnOrders = visibleOrders.filter(
            (order) => order.status === column.status
          );

          return (
            <section key={column.status} style={adminStyles.column}>
              <div style={adminStyles.columnHeader}>
                <h2 style={adminStyles.columnTitle}>{column.title}</h2>

                <span
                  style={{
                    ...adminStyles.statusCount,
                    background: column.color
                  }}
                >
                  {columnOrders.length}
                </span>
              </div>

              <div style={adminStyles.orderList}>
                {columnOrders.length === 0 ? (
                  <div style={adminStyles.emptyColumn}>
                    No hay pedidos en esta etapa.
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <article key={order.id} style={adminStyles.orderCard}>
                      <div style={adminStyles.orderTop}>
                        <strong style={adminStyles.orderNumber}>
                          {order.orderNumber}
                        </strong>

                        <span style={adminStyles.paymentBadge}>
                          {order.paymentMethod}
                        </span>
                      </div>

                      <p style={adminStyles.orderCustomer}>
                        Cliente: {order.customerName}
                      </p>

                      <div style={adminStyles.itemsBox}>
                        {order.items.map((item) => (
                          <div
                            key={`${order.id}-${item.productId}`}
                            style={adminStyles.itemRow}
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <strong>S/ {Number(item.subtotal).toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>

                      <div style={adminStyles.orderTotal}>
                        <span>Total</span>
                        <strong>S/ {Number(order.total).toFixed(2)}</strong>
                      </div>

                      {column.nextStatus ? (
                        <button
                          style={{
                            ...adminStyles.actionButton,
                            background: column.color
                          }}
                          onClick={() =>
                            updateOrderStatus(order.id, column.nextStatus)
                          }
                        >
                          {column.buttonText}
                        </button>
                      ) : (
                        <button style={adminStyles.disabledButton} disabled>
                          {column.buttonText}
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </section>
    </main>
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
    water: "💧"
  };

  return emojis[image] || "🍴";
}

const styles = {
  welcomePage: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.primaryLight} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    padding: "40px"
  },
  welcomeCard: {
    width: "100%",
    maxWidth: "1100px",
    background: COLORS.surface,
    borderRadius: "36px",
    padding: "64px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(11, 46, 107, 0.15)",
    border: `1px solid ${COLORS.border}`
  },
  logoBadge: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
    fontSize: "34px",
    fontWeight: "900",
    letterSpacing: "1px"
  },
  welcomeTitle: {
    fontSize: "64px",
    margin: "0 0 18px",
    color: COLORS.primary
  },
  welcomeSubtitle: {
    fontSize: "24px",
    color: COLORS.textSoft,
    margin: "0 auto 34px",
    maxWidth: "820px",
    lineHeight: 1.5
  },
  welcomeInfoBox: {
    display: "flex",
    justifyContent: "center",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "40px"
  },
  welcomeInfoItem: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    padding: "16px 24px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "18px",
    fontWeight: "700",
    border: `1px solid ${COLORS.border}`
  },
  welcomeInfoNumber: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "900"
  },
  startButton: {
    fontSize: "30px",
    padding: "22px 54px",
    borderRadius: "999px",
    border: "none",
    background: COLORS.primary,
    color: COLORS.white,
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(11, 46, 107, 0.22)"
  },
  kioskPage: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    background: COLORS.background,
    fontFamily: "Arial, sans-serif"
  },
  menuSection: {
    padding: "30px 32px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px"
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  adminShortcut: {
    textDecoration: "none",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "12px 18px",
    fontWeight: "800",
    fontSize: "14px"
  },
  cartCounter: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    padding: "12px 18px",
    borderRadius: "999px",
    fontWeight: "800",
    border: `1px solid ${COLORS.border}`
  },
  menuTitle: {
    fontSize: "56px",
    color: COLORS.primary,
    margin: 0
  },
  menuSubtitle: {
    fontSize: "18px",
    color: COLORS.textSoft,
    margin: "10px 0 0"
  },
  exitButton: {
    fontSize: "18px",
    padding: "14px 24px",
    borderRadius: "999px",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.primary,
    fontWeight: "700",
    cursor: "pointer"
  },
  categoryBar: {
    display: "flex",
    gap: "14px",
    marginBottom: "26px",
    overflowX: "auto",
    paddingBottom: "6px"
  },
  categoryButton: {
    minWidth: "130px",
    padding: "16px 22px",
    borderRadius: "999px",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.primary,
    fontSize: "17px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(11, 46, 107, 0.06)"
  },
  categoryButtonActive: {
    background: COLORS.primary,
    color: COLORS.white,
    border: `1px solid ${COLORS.primary}`
  },
  feedbackBox: {
    background: COLORS.white,
    borderRadius: "24px",
    padding: "48px",
    border: `1px solid ${COLORS.border}`,
    textAlign: "center"
  },
  feedbackTitle: {
    margin: 0,
    fontSize: "22px",
    color: COLORS.primary
  },
  retryButton: {
    marginTop: "18px",
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer"
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "22px"
  },
  productCard: {
    background: COLORS.white,
    borderRadius: "26px",
    padding: "22px",
    minHeight: "270px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 10px 28px rgba(11, 46, 107, 0.08)"
  },
  productTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  productIcon: {
    width: "78px",
    height: "78px",
    borderRadius: "18px",
    background: COLORS.primaryLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px"
  },
  stockBadge: {
    fontSize: "14px",
    fontWeight: "700",
    color: COLORS.secondary,
    background: "#EEF4FF",
    padding: "8px 12px",
    borderRadius: "999px"
  },
  productName: {
    fontSize: "24px",
    color: COLORS.text,
    margin: "0 0 10px"
  },
  productDescription: {
    fontSize: "15px",
    color: COLORS.textSoft,
    lineHeight: 1.45,
    margin: 0
  },
  productBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "18px"
  },
  productPrice: {
    fontSize: "26px",
    color: COLORS.primary
  },
  addButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "12px 20px",
    fontSize: "16px",
    fontWeight: "800"
  },
  cartPanel: {
    background: COLORS.white,
    padding: "30px 26px",
    borderLeft: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column",
    boxShadow: "-10px 0 28px rgba(11, 46, 107, 0.06)"
  },
  cartTitle: {
    fontSize: "42px",
    color: COLORS.primary,
    margin: "0 0 8px"
  },
  cartSubtitle: {
    fontSize: "17px",
    color: COLORS.textSoft,
    margin: "0 0 24px"
  },
  emptyCartBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: COLORS.background,
    borderRadius: "24px",
    border: `1px dashed ${COLORS.border}`,
    padding: "30px",
    textAlign: "center"
  },
  emptyCartIcon: {
    fontSize: "56px",
    marginBottom: "12px"
  },
  emptyCartText: {
    fontSize: "18px",
    color: COLORS.textSoft,
    margin: 0
  },
  cartItems: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  cartItem: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  cartItemInfo: {
    flex: 1
  },
  cartItemName: {
    display: "block",
    fontSize: "17px",
    color: COLORS.text,
    marginBottom: "6px"
  },
  cartItemPrice: {
    margin: "0 0 4px",
    color: COLORS.textSoft,
    fontSize: "14px"
  },
  cartItemSubtotal: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "14px",
    fontWeight: "700"
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  quantityButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: COLORS.primary,
    color: COLORS.white,
    fontSize: "22px",
    fontWeight: "900",
    cursor: "pointer"
  },
  quantityValue: {
    minWidth: "22px",
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "800",
    color: COLORS.text
  },
  cartFooter: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: `2px solid ${COLORS.border}`
  },
  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  totalLabel: {
    fontSize: "30px",
    color: COLORS.text
  },
  totalAmount: {
    fontSize: "34px",
    color: COLORS.primary
  },
  cartButtons: {
    display: "grid",
    gap: "12px"
  },
  clearButton: {
    width: "100%",
    fontSize: "18px",
    padding: "16px",
    borderRadius: "16px",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.primary,
    fontWeight: "800"
  },
  payButton: {
    width: "100%",
    fontSize: "22px",
    padding: "18px",
    borderRadius: "16px",
    border: "none",
    background: COLORS.success,
    color: COLORS.white,
    fontWeight: "900",
    cursor: "pointer"
  },
  paymentBox: {
    display: "grid",
    gap: "16px",
    background: COLORS.background,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px"
  },
  paymentTotalCard: {
    background: COLORS.white,
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: COLORS.primary,
    fontSize: "18px",
    fontWeight: "800"
  },
  paymentMethodButton: {
    width: "100%",
    minHeight: "66px",
    borderRadius: "18px",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.primary,
    fontSize: "20px",
    fontWeight: "900",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px"
  },
  paymentMessage: {
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "800",
    margin: 0
  },
  paymentError: {
    textAlign: "center",
    color: COLORS.danger,
    fontWeight: "800",
    margin: 0
  },
  backButton: {
    width: "100%",
    fontSize: "18px",
    padding: "16px",
    borderRadius: "16px",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.primary,
    fontWeight: "800",
    cursor: "pointer"
  },
  successBox: {
    flex: 1,
    background: COLORS.background,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "34px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  },
  successIcon: {
    width: "86px",
    height: "86px",
    borderRadius: "50%",
    background: COLORS.success,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "54px",
    fontWeight: "900",
    marginBottom: "22px"
  },
  successTitle: {
    fontSize: "34px",
    color: COLORS.primary,
    margin: "0 0 12px"
  },
  successText: {
    color: COLORS.textSoft,
    fontSize: "18px",
    lineHeight: 1.5,
    margin: "0 0 22px"
  },
  orderNumberBox: {
    background: COLORS.white,
    borderRadius: "20px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
    display: "grid",
    gap: "8px",
    color: COLORS.primary,
    marginBottom: "20px",
    width: "100%"
  },
  successSmallText: {
    color: COLORS.textSoft,
    fontSize: "15px",
    lineHeight: 1.4,
    margin: 0
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
    gap: "14px"
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
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "20px"
  },
  metricCard: {
    background: COLORS.white,
    borderRadius: "22px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  metricLabel: {
    display: "block",
    color: COLORS.textSoft,
    fontSize: "15px",
    marginBottom: "10px"
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: "34px"
  },
  metricSmallValue: {
    color: COLORS.primary,
    fontSize: "22px"
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
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px"
  },
  column: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "18px",
    minHeight: "520px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  columnTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "22px"
  },
  statusCount: {
    color: COLORS.white,
    minWidth: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },
  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  emptyColumn: {
    background: COLORS.background,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: "18px",
    padding: "24px",
    color: COLORS.textSoft,
    textAlign: "center",
    fontSize: "15px"
  },
  orderCard: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "16px"
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  orderNumber: {
    color: COLORS.primary,
    fontSize: "22px"
  },
  paymentBadge: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "uppercase"
  },
  orderCustomer: {
    margin: "0 0 12px",
    color: COLORS.textSoft,
    fontSize: "14px"
  },
  itemsBox: {
    display: "grid",
    gap: "8px",
    marginBottom: "14px"
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "14px",
    color: COLORS.text
  },
  orderTotal: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: "12px",
    marginBottom: "14px",
    color: COLORS.primary,
    fontSize: "17px"
  },
  actionButton: {
    width: "100%",
    border: "none",
    color: COLORS.white,
    borderRadius: "14px",
    padding: "13px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer"
  },
  disabledButton: {
    width: "100%",
    border: "none",
    color: COLORS.textSoft,
    background: "#E5EAF3",
    borderRadius: "14px",
    padding: "13px",
    fontWeight: "900",
    fontSize: "15px"
  }
};

createRoot(document.getElementById("root")).render(<Root />);
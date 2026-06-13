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
  danger: "#D72638"
};

function App() {
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
    setCart((currentCart) => {
      const existingProduct = currentCart.find((item) => item.id === product.id);

      if (existingProduct) {
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
                    style={styles.addButton}
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
    fontWeight: "800",
    cursor: "pointer"
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

createRoot(document.getElementById("root")).render(<App />);
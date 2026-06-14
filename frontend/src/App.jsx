import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import Ticket from "./pages/Ticket.jsx";
import Login from "./pages/Login.jsx";
import Reports from "./pages/Reports.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import OrderDisplay from "./pages/OrderDisplay.jsx";
import ProductManagement from "./pages/ProductManagement.jsx";
import UserManagement from "./pages/UserManagement.jsx";

import cafeAmericanoImg from "./assets/productos/cafe-americano.png";
import capuccinoImg from "./assets/productos/capuccino.png";
import jugoNaranjaImg from "./assets/productos/jugo-naranja.png";
import panPolloImg from "./assets/productos/pan-pollo.png";
import empanadaCarneImg from "./assets/productos/empanada-carne.png";
import menuEjecutivoImg from "./assets/productos/menu-ejecutivo.png";
import brownieImg from "./assets/productos/brownie.png";
import aguaMineralImg from "./assets/productos/agua-mineral.png";
import triplePolloImg from "./assets/productos/triple-pollo.png";

import logoUsilImg from "./assets/branding/logo-usil.png";
import logoUsilCuadradoImg from "./assets/branding/logo-usil-cuadrado.png";

import yapeImg from "./assets/pagos/yape.png";
import plinImg from "./assets/pagos/plin.png";
import qrPagoImg from "./assets/pagos/qr-pago.png";

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
  warning: "#F4B400",
  yape: "#8B0AAE",
  plin: "#00CFCB"
};

const PRODUCT_IMAGES = {
  coffee: cafeAmericanoImg,
  cafe: cafeAmericanoImg,
  "cafe-americano": cafeAmericanoImg,
  cappuccino: capuccinoImg,
  capuccino: capuccinoImg,
  juice: jugoNaranjaImg,
  "jugo-naranja": jugoNaranjaImg,
  sandwich: panPolloImg,
  "pan-pollo": panPolloImg,
  empanada: empanadaCarneImg,
  "empanada-carne": empanadaCarneImg,
  menu: menuEjecutivoImg,
  "menu-ejecutivo": menuEjecutivoImg,
  brownie: brownieImg,
  water: aguaMineralImg,
  "agua-mineral": aguaMineralImg,
  food: triplePolloImg,
  "triple-pollo": triplePolloImg
};

const PAYMENT_METHODS = [
  {
    value: "yape",
    label: "Yape",
    description: "Pago móvil",
    image: yapeImg
  },
  {
    value: "plin",
    label: "Plin",
    description: "Pago móvil",
    image: plinImg
  },
  {
    value: "tarjeta",
    label: "Tarjeta",
    description: "Débito / crédito",
    icon: "💳"
  },
  {
    value: "qr",
    label: "QR",
    description: "Escaneo rápido",
    image: qrPagoImg
  }
];

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
  const viewport = useViewportSize();

  const isVerticalMode =
    viewport.width <= 1080 || viewport.height > viewport.width;

  const isVerySmall = viewport.width <= 480;

  const [screen, setScreen] = useState("welcome");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("yape");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [cartModalOpen, setCartModalOpen] = useState(false);

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

  const visibleCategories = useMemo(() => {
    if (selectedCategory === "TODAS") {
      return categories;
    }

    return categories.filter((category) => category === selectedCategory);
  }, [categories, selectedCategory]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (product) => {
    if (!product || product.stock <= 0) {
      setMessage("Este producto no tiene stock disponible.");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          setMessage(`No hay más stock disponible para ${product.name}.`);
          return currentCart;
        }

        setMessage(`${product.name} agregado al pedido.`);

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1
              }
            : item
        );
      }

      setMessage(`${product.name} agregado al pedido.`);

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

  const cancelOrder = () => {
    if (cart.length === 0) {
      setMessage("No hay productos para cancelar.");
      return;
    }

    const confirmed = window.confirm(
      "¿Deseas cancelar el pedido actual y vaciar el carrito?"
    );

    if (!confirmed) return;

    setCart([]);
    setCartModalOpen(false);
    setMessage("Pedido cancelado correctamente.");
  };

  const goToWelcome = () => {
    if (cart.length > 0) {
      const confirmed = window.confirm(
        "Tienes productos en el carrito. ¿Deseas volver al inicio y cancelar el pedido?"
      );

      if (!confirmed) return;

      setCart([]);
    }

    setMessage("");
    setCartModalOpen(false);
    setSelectedCategory("TODAS");
    setScreen("welcome");
  };

  const clearOrder = () => {
    setCart([]);
    setPaymentMethod("yape");
    setCreatedOrder(null);
    setMessage("");
    setCartModalOpen(false);
    setSelectedCategory("TODAS");
    setScreen("menu");
    loadProducts();
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      setMessage("Agrega productos al carrito antes de pagar.");
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmas el pago de S/ ${formatCurrency(total)} y el envío del pedido a cafetería?`
    );

    if (!confirmed) return;

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
      setCartModalOpen(false);
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
      <main
        style={{
          ...kioskStyles.page,
          padding: isVerticalMode ? "22px" : "32px"
        }}
      >
        <section
          style={{
            ...kioskStyles.welcomeCard,
            maxWidth: isVerticalMode ? "760px" : "880px",
            padding: isVerticalMode ? "34px 28px" : "46px"
          }}
        >
          <OfficialLogo
            size={isVerticalMode ? 124 : 116}
            mode="square"
            centered
          />

          <h1
            style={{
              ...kioskStyles.welcomeTitle,
              fontSize: isVerticalMode ? "42px" : "48px"
            }}
          >
            Kiosko Cafetería USIL
          </h1>

          <p
            style={{
              ...kioskStyles.welcomeSubtitle,
              fontSize: isVerticalMode ? "21px" : "20px"
            }}
          >
            Realiza tu pedido de forma rápida, segura y autónoma.
          </p>

          <div
            style={{
              ...kioskStyles.steps,
              gridTemplateColumns: isVerticalMode ? "1fr" : "repeat(2, 1fr)"
            }}
          >
            <div style={kioskStyles.step}>1. Elige tus productos</div>
            <div style={kioskStyles.step}>2. Revisa tu pedido</div>
            <div style={kioskStyles.step}>3. Confirma el pago</div>
            <div style={kioskStyles.step}>4. Retira con tu número</div>
          </div>

          <button
            style={{
              ...kioskStyles.startButton,
              width: isVerticalMode ? "100%" : "auto"
            }}
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
      <main
        style={{
          ...kioskStyles.page,
          padding: isVerticalMode ? "22px" : "32px"
        }}
      >
        <section
          style={{
            ...kioskStyles.confirmationCard,
            padding: isVerticalMode ? "34px 26px" : "42px"
          }}
        >
          <div style={kioskStyles.successIcon}>✓</div>

          <h1
            style={{
              ...kioskStyles.welcomeTitle,
              fontSize: isVerticalMode ? "40px" : "46px"
            }}
          >
            Pedido confirmado
          </h1>

          <p style={kioskStyles.welcomeSubtitle}>
            Tu pedido fue registrado y enviado a cafetería.
          </p>

          {createdOrder && (
            <div style={kioskStyles.ticketBox}>
              <strong>Número de pedido</strong>
              <span style={kioskStyles.orderNumber}>
                {createdOrder.orderNumber}
              </span>
              <span>Total: S/ {formatCurrency(createdOrder.total)}</span>
              <span>Pago: {formatPaymentMethod(createdOrder.paymentMethod)}</span>
              <span>Estado: {formatStatus(createdOrder.status)}</span>
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

  const cartPanel = (
    <CartPanel
      cart={cart}
      total={total}
      totalItems={totalItems}
      paymentMethod={paymentMethod}
      setPaymentMethod={setPaymentMethod}
      addToCart={addToCart}
      removeFromCart={removeFromCart}
      processPayment={processPayment}
      cancelOrder={cancelOrder}
      goToWelcome={goToWelcome}
      loading={loading}
      isVerticalMode={isVerticalMode}
    />
  );

  return (
    <main
      style={{
        ...kioskStyles.menuPage,
        padding: isVerticalMode ? "16px 16px 118px" : "32px"
      }}
    >
      <header
        style={{
          ...kioskStyles.header,
          padding: isVerticalMode ? "18px" : "28px",
          marginBottom: isVerticalMode ? "14px" : "24px"
        }}
      >
        <div style={kioskStyles.headerBrand}>
          <OfficialLogo size={isVerticalMode ? 64 : 78} mode="square" />

          <div>
            <h1
              style={{
                ...kioskStyles.menuTitle,
                fontSize: isVerticalMode ? "30px" : "42px"
              }}
            >
              Catálogo de cafetería
            </h1>

            <p
              style={{
                ...kioskStyles.menuSubtitle,
                fontSize: isVerticalMode ? "15px" : "18px"
              }}
            >
              Selecciona tus productos y confirma tu pedido.
            </p>
          </div>
        </div>
      </header>

      {message && <p style={kioskStyles.message}>{message}</p>}

      <section
        style={{
          ...kioskStyles.menuLayout,
          gridTemplateColumns: isVerticalMode
            ? "1fr"
            : "minmax(0, 1fr) 390px",
          gap: isVerticalMode ? "16px" : "24px"
        }}
      >
        <section style={kioskStyles.productsArea}>
          <div
            style={{
              ...kioskStyles.categoryTabs,
              position: isVerticalMode ? "sticky" : "relative",
              top: isVerticalMode ? "0" : "auto",
              zIndex: isVerticalMode ? 5 : 1,
              background: COLORS.background,
              padding: isVerticalMode ? "4px 0 8px" : "0 0 4px"
            }}
          >
            <button
              style={{
                ...kioskStyles.categoryTab,
                ...(selectedCategory === "TODAS"
                  ? kioskStyles.categoryTabActive
                  : {})
              }}
              onClick={() => setSelectedCategory("TODAS")}
            >
              Todos
            </button>

            {categories.map((category) => (
              <button
                key={category}
                style={{
                  ...kioskStyles.categoryTab,
                  ...(selectedCategory === category
                    ? kioskStyles.categoryTabActive
                    : {})
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading && <p style={kioskStyles.loadingText}>Cargando productos...</p>}

          {visibleCategories.map((category) => {
            const categoryProducts = products.filter(
              (product) => product.category === category
            );

            if (categoryProducts.length === 0) return null;

            return (
              <div key={category} style={kioskStyles.categoryBlock}>
                <h2
                  style={{
                    ...kioskStyles.categoryTitle,
                    fontSize: isVerticalMode ? "27px" : "28px"
                  }}
                >
                  {category}
                </h2>

                <div
                  style={{
                    ...kioskStyles.productGrid,
                    gridTemplateColumns: isVerySmall
                      ? "1fr"
                      : isVerticalMode
                        ? "repeat(2, minmax(0, 1fr))"
                        : "repeat(auto-fill, minmax(270px, 1fr))",
                    gap: isVerticalMode ? "14px" : "18px"
                  }}
                >
                  {categoryProducts.map((product) => (
                    <article
                      key={product.id}
                      style={{
                        ...kioskStyles.productCard,
                        padding: isVerticalMode ? "13px" : "20px",
                        borderRadius: isVerticalMode ? "22px" : "24px"
                      }}
                    >
                      <div
                        style={{
                          ...kioskStyles.productImageBox,
                          height: isVerySmall
                            ? "170px"
                            : isVerticalMode
                              ? "155px"
                              : "215px"
                        }}
                      >
                        {getProductImage(product) ? (
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            style={kioskStyles.productImage}
                          />
                        ) : (
                          <div style={kioskStyles.productIcon}>
                            {getProductEmoji(product.image)}
                          </div>
                        )}
                      </div>

                      <h3
                        style={{
                          ...kioskStyles.productName,
                          fontSize: isVerticalMode ? "21px" : "22px"
                        }}
                      >
                        {product.name}
                      </h3>

                      <p
                        style={{
                          ...kioskStyles.productDescription,
                          fontSize: isVerticalMode ? "14px" : "15px"
                        }}
                      >
                        {product.description}
                      </p>

                      <div style={kioskStyles.productBottom}>
                        <strong>S/ {formatCurrency(product.price)}</strong>
                        <span>Stock: {product.stock}</span>
                      </div>

                      <button
                        style={{
                          ...kioskStyles.addButton,
                          opacity: product.stock <= 0 ? 0.55 : 1
                        }}
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock <= 0 ? "Sin stock" : "Agregar"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {!isVerticalMode && cartPanel}
      </section>

      {isVerticalMode && (
        <>
          <CartBottomBar
            total={total}
            totalItems={totalItems}
            onOpen={() => setCartModalOpen(true)}
            disabled={loading}
          />

          {cartModalOpen && (
            <CartModal onClose={() => setCartModalOpen(false)}>
              {cartPanel}
            </CartModal>
          )}
        </>
      )}
    </main>
  );
}

function CartBottomBar({ total, totalItems, onOpen, disabled }) {
  return (
    <section style={kioskStyles.bottomBar}>
      <div>
        <strong style={kioskStyles.bottomBarTitle}>
          {totalItems === 0
            ? "Pedido vacío"
            : `${totalItems} producto${totalItems === 1 ? "" : "s"}`}
        </strong>
        <span style={kioskStyles.bottomBarTotal}>S/ {formatCurrency(total)}</span>
      </div>

      <button
        style={{
          ...kioskStyles.bottomBarButton,
          opacity: disabled ? 0.65 : 1
        }}
        onClick={onOpen}
        disabled={disabled}
      >
        Ver pedido
      </button>
    </section>
  );
}

function CartModal({ children, onClose }) {
  return (
    <div style={kioskStyles.modalOverlay}>
      <section style={kioskStyles.modalCard}>
        <div style={kioskStyles.modalHandle} />

        <button style={kioskStyles.modalCloseButton} onClick={onClose}>
          Cerrar
        </button>

        {children}
      </section>
    </div>
  );
}

function CartPanel({
  cart,
  total,
  totalItems,
  paymentMethod,
  setPaymentMethod,
  addToCart,
  removeFromCart,
  processPayment,
  cancelOrder,
  goToWelcome,
  loading,
  isVerticalMode
}) {
  const selectedPayment = PAYMENT_METHODS.find(
    (method) => method.value === paymentMethod
  );

  return (
    <aside
      style={{
        ...kioskStyles.cartPanel,
        ...(isVerticalMode ? kioskStyles.cartPanelVertical : {})
      }}
    >
      <div style={kioskStyles.cartHeader}>
        <div>
          <h2 style={kioskStyles.cartTitle}>Tu pedido</h2>
          <p style={kioskStyles.cartSubtitle}>
            {totalItems === 0
              ? "Aún no agregaste productos."
              : `${totalItems} producto${totalItems === 1 ? "" : "s"} seleccionado${
                  totalItems === 1 ? "" : "s"
                }.`}
          </p>
        </div>

        {totalItems > 0 && <span style={kioskStyles.cartBadge}>{totalItems}</span>}
      </div>

      {cart.length === 0 ? (
        <p style={kioskStyles.emptyCart}>
          Elige productos del catálogo para iniciar tu pedido.
        </p>
      ) : (
        <div
          style={{
            ...kioskStyles.cartList,
            maxHeight: isVerticalMode ? "260px" : "none",
            overflowY: isVerticalMode ? "auto" : "visible"
          }}
        >
          {cart.map((item) => (
            <div key={item.id} style={kioskStyles.cartItem}>
              <div>
                <strong>{item.name}</strong>

                <span style={kioskStyles.cartDetail}>
                  S/ {formatCurrency(item.price)} x {item.quantity}
                </span>
              </div>

              <div style={kioskStyles.cartActions}>
                <button
                  style={kioskStyles.quantityButton}
                  onClick={() => removeFromCart(item.id)}
                >
                  -
                </button>

                <span style={kioskStyles.quantityText}>{item.quantity}</span>

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
        <strong>S/ {formatCurrency(total)}</strong>
      </div>

      <div style={kioskStyles.paymentBox}>
        <span style={kioskStyles.paymentLabel}>Método de pago</span>

        <PaymentSelector
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
        />
      </div>

      {selectedPayment && (
        <div style={kioskStyles.selectedPaymentBox}>
          <div style={kioskStyles.selectedPaymentLeft}>
            {selectedPayment.image ? (
              <img
                src={selectedPayment.image}
                alt={selectedPayment.label}
                style={kioskStyles.selectedPaymentImage}
              />
            ) : (
              <span style={kioskStyles.selectedPaymentIcon}>
                {selectedPayment.icon}
              </span>
            )}

            <div>
              <strong>{selectedPayment.label}</strong>
              <span>{selectedPayment.description}</span>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "qr" && (
        <div style={kioskStyles.qrPreviewBox}>
          <img src={qrPagoImg} alt="QR de pago" style={kioskStyles.qrPreview} />
          <span>Escanea el QR para simular el pago.</span>
        </div>
      )}

      <button
        style={{
          ...kioskStyles.payButton,
          opacity: loading || cart.length === 0 ? 0.6 : 1
        }}
        onClick={processPayment}
        disabled={loading || cart.length === 0}
      >
        {loading ? "Procesando..." : `Pagar S/ ${formatCurrency(total)}`}
      </button>

      <div style={kioskStyles.cartSecondaryActions}>
        {cart.length > 0 && (
          <button style={kioskStyles.cancelButton} onClick={cancelOrder}>
            Cancelar pedido
          </button>
        )}

        <button style={kioskStyles.homeButton} onClick={goToWelcome}>
          Volver al inicio
        </button>
      </div>
    </aside>
  );
}

function PaymentSelector({ paymentMethod, setPaymentMethod }) {
  return (
    <div style={kioskStyles.paymentOptions}>
      {PAYMENT_METHODS.map((method) => {
        const isActive = paymentMethod === method.value;

        return (
          <button
            key={method.value}
            type="button"
            style={{
              ...kioskStyles.paymentOption,
              ...(isActive ? kioskStyles.paymentOptionActive : {})
            }}
            onClick={() => setPaymentMethod(method.value)}
          >
            <span style={kioskStyles.paymentLogoBox}>
              {method.image ? (
                <img
                  src={method.image}
                  alt={method.label}
                  style={kioskStyles.paymentLogo}
                />
              ) : (
                <span style={kioskStyles.paymentIcon}>{method.icon}</span>
              )}
            </span>

            <span style={kioskStyles.paymentOptionText}>
              <strong>{method.label}</strong>
              <small>{method.description}</small>
            </span>
          </button>
        );
      })}
    </div>
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
        <div style={adminStyles.headerBrand}>
          <OfficialLogo size={78} mode="square" />

          <div>
            <h1 style={adminStyles.title}>Panel de cafetería</h1>

            <p style={adminStyles.subtitle}>
              Gestiona pedidos, preparación y entrega.
            </p>
          </div>
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
          <strong>S/ {formatCurrency(salesTotal)}</strong>
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
              <span>S/ {formatCurrency(order.total)}</span>
            </div>

            <p style={adminStyles.orderClient}>{order.customerName}</p>

            <ul style={adminStyles.itemList}>
              {order.items.map((item, index) => (
                <li key={`${order.id}-${index}`}>
                  {item.quantity}x {item.name}
                </li>
              ))}
            </ul>

            <p style={adminStyles.paymentText}>
              Pago: {formatPaymentMethod(order.paymentMethod)}
            </p>

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

function OfficialLogo({ size = 72, mode = "square", centered = false }) {
  const image = mode === "horizontal" ? logoUsilImg : logoUsilCuadradoImg;

  return (
    <div
      style={{
        ...kioskStyles.officialLogoBox,
        width: size,
        height: size,
        margin: centered ? "0 auto 22px" : 0
      }}
    >
      <img src={image} alt="USIL" style={kioskStyles.officialLogoImage} />
    </div>
  );
}

function useViewportSize() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return viewport;
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

function getProductImage(product) {
  if (!product) return null;

  const imageKey = normalizeText(product.image || "");

  if (imageKey && PRODUCT_IMAGES[imageKey]) {
    return PRODUCT_IMAGES[imageKey];
  }

  const name = normalizeText(product.name || "");

  if (name.includes("cafe")) {
    return cafeAmericanoImg;
  }

  if (name.includes("capuccino") || name.includes("cappuccino")) {
    return capuccinoImg;
  }

  if (name.includes("jugo")) {
    return jugoNaranjaImg;
  }

  if (name.includes("pan con pollo")) {
    return panPolloImg;
  }

  if (name.includes("empanada")) {
    return empanadaCarneImg;
  }

  if (name.includes("menu")) {
    return menuEjecutivoImg;
  }

  if (name.includes("brownie")) {
    return brownieImg;
  }

  if (name.includes("agua")) {
    return aguaMineralImg;
  }

  if (name.includes("triple")) {
    return triplePolloImg;
  }

  return null;
}

function normalizeText(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

function formatPaymentMethod(method) {
  const labels = {
    yape: "Yape",
    plin: "Plin",
    tarjeta: "Tarjeta",
    qr: "QR",
    pendiente: "Pendiente"
  };

  return labels[method] || method;
}

function formatStatus(status) {
  const labels = {
    pendiente: "Pendiente",
    pagado: "Pagado",
    preparando: "En preparación",
    listo: "Listo",
    entregado: "Entregado",
    cancelado: "Cancelado"
  };

  return labels[status] || status;
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
    width: "100%",
    maxWidth: "880px",
    background: COLORS.white,
    borderRadius: "34px",
    padding: "46px",
    textAlign: "center",
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)"
  },
  confirmationCard: {
    width: "100%",
    maxWidth: "660px",
    background: COLORS.white,
    borderRadius: "34px",
    padding: "42px",
    textAlign: "center",
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)"
  },
  officialLogoBox: {
    borderRadius: "22px",
    overflow: "hidden",
    background: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 10px 24px rgba(11, 46, 107, 0.13)",
    flexShrink: 0
  },
  officialLogoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },
  welcomeTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "48px"
  },
  welcomeSubtitle: {
    margin: "12px 0 0",
    color: COLORS.textSoft,
    fontSize: "20px",
    lineHeight: 1.45
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
    fontWeight: "800",
    fontSize: "17px"
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
    fontWeight: "800",
    marginBottom: "18px"
  },
  menuLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 390px",
    gap: "24px",
    alignItems: "start"
  },
  productsArea: {
    display: "grid",
    gap: "24px"
  },
  categoryTabs: {
    display: "flex",
    gap: "12px",
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "thin"
  },
  categoryTab: {
    minWidth: "fit-content",
    background: COLORS.white,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "13px 20px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(11, 46, 107, 0.05)"
  },
  categoryTabActive: {
    background: COLORS.primary,
    color: COLORS.white,
    border: `1px solid ${COLORS.primary}`
  },
  loadingText: {
    color: COLORS.textSoft,
    fontWeight: "800"
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
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
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
  productImageBox: {
    width: "100%",
    height: "215px",
    borderRadius: "22px",
    background: "#F8FAFE",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block"
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
    fontSize: "22px",
    lineHeight: 1.12
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
    color: COLORS.primary,
    fontSize: "15px"
  },
  addButton: {
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer"
  },
  bottomBar: {
    position: "fixed",
    left: "14px",
    right: "14px",
    bottom: "14px",
    background: COLORS.primary,
    color: COLORS.white,
    borderRadius: "26px",
    padding: "16px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    zIndex: 20,
    boxShadow: "0 20px 50px rgba(11, 46, 107, 0.35)"
  },
  bottomBarTitle: {
    display: "block",
    fontSize: "16px"
  },
  bottomBarTotal: {
    display: "block",
    fontSize: "22px",
    fontWeight: "900",
    marginTop: "4px"
  },
  bottomBarButton: {
    background: COLORS.white,
    color: COLORS.primary,
    border: "none",
    borderRadius: "999px",
    padding: "15px 22px",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer",
    minWidth: "132px"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(7, 19, 42, 0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 40,
    padding: "14px"
  },
  modalCard: {
    width: "100%",
    maxWidth: "760px",
    maxHeight: "88vh",
    overflowY: "auto",
    background: COLORS.white,
    borderRadius: "30px 30px 24px 24px",
    border: `1px solid ${COLORS.border}`,
    padding: "14px",
    boxShadow: "0 -20px 60px rgba(7, 19, 42, 0.25)"
  },
  modalHandle: {
    width: "66px",
    height: "6px",
    borderRadius: "999px",
    background: COLORS.border,
    margin: "4px auto 12px"
  },
  modalCloseButton: {
    width: "100%",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer",
    marginBottom: "12px"
  },
  cartPanel: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    position: "sticky",
    top: "24px",
    boxShadow: "0 18px 42px rgba(11, 46, 107, 0.12)",
    zIndex: 4
  },
  cartPanelVertical: {
    position: "relative",
    top: 0,
    padding: "16px",
    borderRadius: "22px",
    boxShadow: "none"
  },
  cartHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start"
  },
  cartTitle: {
    margin: "0 0 6px",
    color: COLORS.primary,
    fontSize: "30px"
  },
  cartSubtitle: {
    margin: 0,
    color: COLORS.textSoft,
    fontSize: "14px"
  },
  cartBadge: {
    minWidth: "36px",
    height: "36px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },
  emptyCart: {
    color: COLORS.textSoft,
    background: COLORS.background,
    borderRadius: "16px",
    padding: "14px",
    marginTop: "14px"
  },
  cartList: {
    display: "grid",
    gap: "12px",
    marginTop: "14px"
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
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "none",
    background: COLORS.primary,
    color: COLORS.white,
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "18px"
  },
  quantityText: {
    minWidth: "18px",
    textAlign: "center",
    fontWeight: "900",
    color: COLORS.primary
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
    display: "block",
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: "10px"
  },
  paymentOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px"
  },
  paymentOption: {
    background: COLORS.white,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    textAlign: "left",
    minHeight: "74px"
  },
  paymentOptionActive: {
    border: `2px solid ${COLORS.primary}`,
    background: COLORS.primaryLight,
    boxShadow: "0 10px 22px rgba(11, 46, 107, 0.12)"
  },
  paymentLogoBox: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0
  },
  paymentLogo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block"
  },
  paymentIcon: {
    fontSize: "25px"
  },
  paymentOptionText: {
    display: "grid",
    gap: "2px"
  },
  selectedPaymentBox: {
    marginTop: "12px",
    background: COLORS.background,
    borderRadius: "16px",
    padding: "12px",
    border: `1px solid ${COLORS.border}`
  },
  selectedPaymentLeft: {
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },
  selectedPaymentImage: {
    width: "48px",
    height: "48px",
    objectFit: "contain",
    borderRadius: "14px",
    background: COLORS.white
  },
  selectedPaymentIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px"
  },
  qrPreviewBox: {
    marginTop: "12px",
    background: "#FFF7FF",
    border: "1px solid #EAC6F1",
    borderRadius: "18px",
    padding: "14px",
    display: "grid",
    justifyItems: "center",
    gap: "8px",
    color: COLORS.yape,
    fontWeight: "900",
    textAlign: "center"
  },
  qrPreview: {
    width: "160px",
    height: "160px",
    objectFit: "contain",
    borderRadius: "16px",
    background: COLORS.white
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
  cartSecondaryActions: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "12px"
  },
  cancelButton: {
    width: "100%",
    background: "#FFE9EC",
    color: COLORS.danger,
    border: "none",
    borderRadius: "16px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer"
  },
  homeButton: {
    width: "100%",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "13px",
    fontSize: "15px",
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
  headerBrand: {
    display: "flex",
    gap: "18px",
    alignItems: "center"
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
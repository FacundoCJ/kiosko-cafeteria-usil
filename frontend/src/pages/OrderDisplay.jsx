import React, { useEffect, useState } from "react";

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
  warning: "#F4B400"
};

export default function OrderDisplay() {
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      setMessage("");

      const response = await fetch(`${API_URL}/orders/public/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar la pantalla de pedidos");
      }

      setPreparingOrders(data.preparing || []);
      setReadyOrders(data.ready || []);

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cargar pedidos.");
    }
  };

  useEffect(() => {
    loadOrders();

    const intervalId = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logo}>USIL</div>

          <div>
            <h1 style={styles.title}>Pantalla de pedidos</h1>
            <p style={styles.subtitle}>
              Revisa tu número de pedido y acércate cuando esté listo.
            </p>
          </div>
        </div>

        <div style={styles.clockBox}>
          <span>Actualizado</span>
          <strong>{lastUpdated || "--:--:--"}</strong>
        </div>
      </header>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.columns}>
        <section style={styles.column}>
          <div style={styles.columnHeader}>
            <h2 style={styles.preparingTitle}>En preparación</h2>
            <span style={styles.countBadge}>{preparingOrders.length}</span>
          </div>

          {preparingOrders.length === 0 ? (
            <div style={styles.emptyBox}>
              No hay pedidos en preparación por ahora.
            </div>
          ) : (
            <div style={styles.orderGrid}>
              {preparingOrders.map((order) => (
                <article key={order.id} style={styles.preparingCard}>
                  <span style={styles.orderNumber}>{order.orderNumber}</span>
                  <span style={styles.orderStatus}>
                    {formatStatus(order.status)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={styles.columnReady}>
          <div style={styles.columnHeader}>
            <h2 style={styles.readyTitle}>Listos para recoger</h2>
            <span style={styles.readyCountBadge}>{readyOrders.length}</span>
          </div>

          {readyOrders.length === 0 ? (
            <div style={styles.emptyReadyBox}>
              Cuando tu pedido esté listo aparecerá aquí.
            </div>
          ) : (
            <div style={styles.readyGrid}>
              {readyOrders.map((order) => (
                <article key={order.id} style={styles.readyCard}>
                  <span style={styles.readyOrderNumber}>{order.orderNumber}</span>
                  <span style={styles.readyText}>Acércate al módulo</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer style={styles.footer}>
        Cafetería USIL · Sistema de Kiosko Táctil para Autoservicio
      </footer>
    </main>
  );
}

function formatStatus(status) {
  const labels = {
    pagado: "Pagado",
    preparando: "Preparando",
    listo: "Listo"
  };

  return labels[status] || status;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.background,
    fontFamily: "Arial, sans-serif",
    color: COLORS.text,
    padding: "34px",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    background: COLORS.white,
    borderRadius: "30px",
    border: `1px solid ${COLORS.border}`,
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    boxShadow: "0 14px 38px rgba(11, 46, 107, 0.08)"
  },
  brand: {
    display: "flex",
    gap: "22px",
    alignItems: "center"
  },
  logo: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "900",
    flexShrink: 0
  },
  title: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "54px",
    letterSpacing: "-1px"
  },
  subtitle: {
    margin: "10px 0 0",
    color: COLORS.textSoft,
    fontSize: "22px"
  },
  clockBox: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "22px",
    padding: "18px 24px",
    display: "grid",
    gap: "6px",
    textAlign: "right"
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
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1.25fr",
    gap: "28px",
    alignItems: "stretch"
  },
  column: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "30px",
    padding: "26px",
    boxShadow: "0 14px 38px rgba(11, 46, 107, 0.08)"
  },
  columnReady: {
    background: COLORS.white,
    border: `2px solid ${COLORS.success}`,
    borderRadius: "30px",
    padding: "26px",
    boxShadow: "0 14px 38px rgba(31, 157, 85, 0.14)"
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "22px"
  },
  preparingTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "42px"
  },
  readyTitle: {
    margin: 0,
    color: COLORS.success,
    fontSize: "42px"
  },
  countBadge: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "999px",
    padding: "10px 18px",
    fontWeight: "900",
    fontSize: "22px"
  },
  readyCountBadge: {
    background: "#E9F8EF",
    color: COLORS.success,
    borderRadius: "999px",
    padding: "10px 18px",
    fontWeight: "900",
    fontSize: "22px"
  },
  orderGrid: {
    display: "grid",
    gap: "18px"
  },
  readyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px"
  },
  preparingCard: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "24px",
    padding: "24px",
    display: "grid",
    gap: "8px"
  },
  readyCard: {
    background: "#E9F8EF",
    border: "2px solid #BFE8CE",
    borderRadius: "26px",
    padding: "28px",
    display: "grid",
    gap: "10px",
    textAlign: "center"
  },
  orderNumber: {
    color: COLORS.primary,
    fontSize: "42px",
    fontWeight: "900"
  },
  orderStatus: {
    color: COLORS.textSoft,
    fontSize: "22px",
    fontWeight: "800"
  },
  readyOrderNumber: {
    color: COLORS.success,
    fontSize: "54px",
    fontWeight: "900"
  },
  readyText: {
    color: COLORS.text,
    fontSize: "22px",
    fontWeight: "800"
  },
  emptyBox: {
    background: COLORS.background,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: "24px",
    padding: "36px",
    color: COLORS.textSoft,
    textAlign: "center",
    fontSize: "22px"
  },
  emptyReadyBox: {
    background: "#E9F8EF",
    border: "1px dashed #BFE8CE",
    borderRadius: "24px",
    padding: "36px",
    color: COLORS.success,
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "800"
  },
  footer: {
    textAlign: "center",
    color: COLORS.textSoft,
    fontSize: "18px",
    marginTop: "24px"
  }
};
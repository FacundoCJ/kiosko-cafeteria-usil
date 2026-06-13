import React, { useEffect, useMemo, useState } from "react";

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
  warning: "#F4B400",
  danger: "#D72638",
  orange: "#EA7A1A"
};

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

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);

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
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>USIL</div>
          <h1 style={styles.title}>Panel Cafetería</h1>
          <p style={styles.subtitle}>
            Gestión de pedidos recibidos desde el kiosko de autoservicio.
          </p>
        </div>

        <div style={styles.headerActions}>
          <a href="/" style={styles.linkButton}>
            Ir al kiosko
          </a>

          <button style={styles.refreshButton} onClick={loadOrders}>
            Actualizar
          </button>
        </div>
      </header>

      <section style={styles.metrics}>
        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Pedidos visibles</span>
          <strong style={styles.metricValue}>{visibleOrders.length}</strong>
        </article>

        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Pendientes de atención</span>
          <strong style={styles.metricValue}>{pendingKitchenOrders}</strong>
        </article>

        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Ventas registradas</span>
          <strong style={styles.metricValue}>S/ {todaySales.toFixed(2)}</strong>
        </article>

        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Actualización</span>
          <strong style={styles.metricSmallValue}>
            {loading ? "Cargando..." : "Cada 3 segundos"}
          </strong>
        </article>
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.board}>
        {columns.map((column) => {
          const columnOrders = visibleOrders.filter(
            (order) => order.status === column.status
          );

          return (
            <section key={column.status} style={styles.column}>
              <div style={styles.columnHeader}>
                <h2 style={styles.columnTitle}>{column.title}</h2>
                <span
                  style={{
                    ...styles.statusCount,
                    background: column.color
                  }}
                >
                  {columnOrders.length}
                </span>
              </div>

              <div style={styles.orderList}>
                {columnOrders.length === 0 ? (
                  <div style={styles.emptyColumn}>
                    No hay pedidos en esta etapa.
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <article key={order.id} style={styles.orderCard}>
                      <div style={styles.orderTop}>
                        <strong style={styles.orderNumber}>
                          {order.orderNumber}
                        </strong>

                        <span style={styles.paymentBadge}>
                          {order.paymentMethod}
                        </span>
                      </div>

                      <p style={styles.orderCustomer}>
                        Cliente: {order.customerName}
                      </p>

                      <div style={styles.itemsBox}>
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.productId}`} style={styles.itemRow}>
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <strong>S/ {item.subtotal.toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>

                      <div style={styles.orderTotal}>
                        <span>Total</span>
                        <strong>S/ {order.total.toFixed(2)}</strong>
                      </div>

                      {column.nextStatus ? (
                        <button
                          style={{
                            ...styles.actionButton,
                            background: column.color
                          }}
                          onClick={() =>
                            updateOrderStatus(order.id, column.nextStatus)
                          }
                        >
                          {column.buttonText}
                        </button>
                      ) : (
                        <button style={styles.disabledButton} disabled>
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

const styles = {
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
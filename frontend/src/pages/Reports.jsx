import React, { useEffect, useMemo, useState } from "react";
import { getAuthHeaders, logout } from "../services/auth.service.js";

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

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (from) {
      params.append("from", from);
    }

    if (to) {
      params.append("to", to);
    }

    const query = params.toString();
    return query ? `?${query}` : "";
  }, [from, to]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [summaryResponse, topProductsResponse, salesByDayResponse] =
        await Promise.all([
          fetch(`${API_URL}/reports/summary${queryString}`, {
            headers: getAuthHeaders()
          }),
          fetch(`${API_URL}/reports/top-products${queryString}`, {
            headers: getAuthHeaders()
          }),
          fetch(`${API_URL}/reports/sales-by-day${queryString}`, {
            headers: getAuthHeaders()
          })
        ]);

      const summaryData = await summaryResponse.json();
      const topProductsData = await topProductsResponse.json();
      const salesByDayData = await salesByDayResponse.json();

      if (!summaryResponse.ok) {
        throw new Error(summaryData.message || "No se pudo cargar el resumen");
      }

      if (!topProductsResponse.ok) {
        throw new Error(
          topProductsData.message || "No se pudieron cargar productos vendidos"
        );
      }

      if (!salesByDayResponse.ok) {
        throw new Error(
          salesByDayData.message || "No se pudieron cargar ventas por día"
        );
      }

      setSummary(summaryData.summary);
      setTopProducts(topProductsData.products || []);
      setSalesByDay(salesByDayData.salesByDay || []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cargar reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const maxProductQuantity = useMemo(() => {
    if (topProducts.length === 0) return 1;
    return Math.max(...topProducts.map((product) => product.quantitySold));
  }, [topProducts]);

  const maxDailySales = useMemo(() => {
    if (salesByDay.length === 0) return 1;
    return Math.max(...salesByDay.map((day) => day.totalSales));
  }, [salesByDay]);

  const paymentMethods = summary?.salesByPaymentMethod
    ? Object.entries(summary.salesByPaymentMethod)
    : [];

  const orderStatuses = summary?.ordersByStatus
    ? Object.entries(summary.ordersByStatus)
    : [];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>USIL</div>
          <h1 style={styles.title}>Reportes gerenciales</h1>
          <p style={styles.subtitle}>
            Indicadores de ventas, pedidos y productos del kiosko.
          </p>
        </div>

        <div style={styles.headerActions}>
          <a href="/admin" style={styles.secondaryButton}>
            Panel pedidos
          </a>

          <a href="/admin/productos" style={styles.secondaryButton}>
            Productos
          </a>

          <a href="/" style={styles.secondaryButton}>
            Ir al kiosko
          </a>

          <button style={styles.primaryButton} onClick={loadReports}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.filtersCard}>
        <div>
          <h2 style={styles.sectionTitle}>Filtro de fechas</h2>
          <p style={styles.sectionSubtitle}>
            Puedes revisar reportes generales o por rango de fechas.
          </p>
        </div>

        <div style={styles.filterActions}>
          <label style={styles.label}>
            Desde
            <input
              style={styles.input}
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>

          <label style={styles.label}>
            Hasta
            <input
              style={styles.input}
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>

          <button style={styles.primaryButton} onClick={loadReports}>
            Aplicar filtro
          </button>

          <button
            style={styles.clearButton}
            onClick={() => {
              setFrom("");
              setTo("");
              setTimeout(loadReports, 100);
            }}
          >
            Limpiar
          </button>
        </div>
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.metrics}>
        <MetricCard
          label="Ventas totales"
          value={`S/ ${money(summary?.totalSales)}`}
        />
        <MetricCard label="Pedidos" value={summary?.totalOrders || 0} />
        <MetricCard
          label="Ticket promedio"
          value={`S/ ${money(summary?.averageTicket)}`}
        />
        <MetricCard
          label="Productos vendidos"
          value={summary?.totalProductsSold || 0}
        />
        <MetricCard
          label="Pedidos entregados"
          value={summary?.deliveredOrders || 0}
        />
        <MetricCard
          label="Pedidos pendientes"
          value={summary?.pendingOrders || 0}
        />
        <MetricCard
          label="Productos activos"
          value={summary?.activeProducts || 0}
        />
        <MetricCard
          label="Stock bajo"
          value={summary?.lowStockProducts || 0}
        />
      </section>

      <section style={styles.layout}>
        <article style={styles.cardLarge}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Productos más vendidos</h2>
              <p style={styles.sectionSubtitle}>
                Ranking por cantidad vendida.
              </p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div style={styles.emptyBox}>Aún no hay productos vendidos.</div>
          ) : (
            <div style={styles.list}>
              {topProducts.map((product, index) => {
                const width = Math.max(
                  8,
                  (product.quantitySold / maxProductQuantity) * 100
                );

                return (
                  <div key={product.productId} style={styles.rankingItem}>
                    <div style={styles.rankingTop}>
                      <strong>
                        #{index + 1} {product.name}
                      </strong>
                      <span>{product.quantitySold} vendidos</span>
                    </div>

                    <p style={styles.itemSubtitle}>
                      {product.category} · S/ {money(product.totalSales)}
                    </p>

                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article style={styles.card}>
          <h2 style={styles.sectionTitle}>Ventas por método de pago</h2>

          {paymentMethods.length === 0 ? (
            <div style={styles.emptyBox}>Sin pagos registrados.</div>
          ) : (
            <div style={styles.list}>
              {paymentMethods.map(([method, amount]) => (
                <div key={method} style={styles.simpleRow}>
                  <span style={styles.methodName}>{formatMethod(method)}</span>
                  <strong>S/ {money(amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article style={styles.card}>
          <h2 style={styles.sectionTitle}>Pedidos por estado</h2>

          {orderStatuses.length === 0 ? (
            <div style={styles.emptyBox}>Sin pedidos registrados.</div>
          ) : (
            <div style={styles.list}>
              {orderStatuses.map(([status, total]) => (
                <div key={status} style={styles.simpleRow}>
                  <span style={styles.statusBadge}>{formatStatus(status)}</span>
                  <strong>{total}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article style={styles.cardLarge}>
          <h2 style={styles.sectionTitle}>Ventas por día</h2>
          <p style={styles.sectionSubtitle}>
            Monto vendido y número de pagos registrados por fecha.
          </p>

          {salesByDay.length === 0 ? (
            <div style={styles.emptyBox}>Sin ventas por día.</div>
          ) : (
            <div style={styles.list}>
              {salesByDay.map((day) => {
                const width = Math.max(
                  8,
                  (day.totalSales / maxDailySales) * 100
                );

                return (
                  <div key={day.date} style={styles.rankingItem}>
                    <div style={styles.rankingTop}>
                      <strong>{day.date}</strong>
                      <span>S/ {money(day.totalSales)}</span>
                    </div>

                    <p style={styles.itemSubtitle}>{day.payments} pagos</p>

                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <article style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </article>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function formatMethod(method) {
  const labels = {
    yape: "Yape",
    plin: "Plin",
    tarjeta: "Tarjeta",
    qr: "QR"
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
    gap: "14px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  primaryButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "14px 24px",
    fontWeight: "800",
    fontSize: "16px",
    cursor: "pointer"
  },
  secondaryButton: {
    textDecoration: "none",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "14px 24px",
    fontWeight: "800",
    fontSize: "16px"
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
  filtersCard: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  filterActions: {
    display: "flex",
    gap: "14px",
    alignItems: "end",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  label: {
    display: "grid",
    gap: "8px",
    color: COLORS.text,
    fontSize: "15px",
    fontWeight: "800"
  },
  input: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "13px 14px",
    fontSize: "16px",
    color: COLORS.text,
    background: COLORS.white,
    outline: "none"
  },
  clearButton: {
    background: COLORS.white,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "14px 24px",
    fontWeight: "800",
    fontSize: "16px",
    cursor: "pointer"
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
    fontSize: "32px"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "22px",
    alignItems: "start"
  },
  card: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  cardLarge: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "18px"
  },
  sectionTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "28px"
  },
  sectionSubtitle: {
    margin: "6px 0 0",
    color: COLORS.textSoft,
    fontSize: "15px"
  },
  list: {
    display: "grid",
    gap: "14px"
  },
  rankingItem: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "16px"
  },
  rankingTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    color: COLORS.primary,
    fontSize: "17px"
  },
  itemSubtitle: {
    margin: "8px 0 12px",
    color: COLORS.textSoft
  },
  barTrack: {
    height: "12px",
    background: COLORS.primaryLight,
    borderRadius: "999px",
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    background: COLORS.primary,
    borderRadius: "999px"
  },
  simpleRow: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: COLORS.primary
  },
  methodName: {
    fontWeight: "800"
  },
  statusBadge: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: "900"
  },
  emptyBox: {
    background: COLORS.background,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: "18px",
    padding: "28px",
    color: COLORS.textSoft,
    textAlign: "center"
  }
};
import React, { useEffect, useMemo, useState } from "react";
import logoUsilCuadradoImg from "../assets/branding/logo-usil-cuadrado.png";
import {
  getAuthHeaders,
  getCurrentUser,
  logout
} from "../services/auth.service.js";

const API_URL = "/api";

const COLORS = {
  primary: "#0B2E6B",
  primaryLight: "#EAF1FF",
  white: "#FFFFFF",
  background: "#F5F7FB",
  text: "#162033",
  textSoft: "#5B6780",
  border: "#D7E1F2",
  success: "#1F9D55",
  successLight: "#E9F8EF",
  danger: "#D72638",
  dangerLight: "#FFE9EC",
  warning: "#F4B400",
  warningLight: "#FFF7DF",
  purple: "#8B0AAE",
  purpleLight: "#F8E9FF"
};

export default function Reports() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const query = params.toString();

    return query ? `?${query}` : "";
  }, [startDate, endDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [summaryResponse, topProductsResponse, salesByDayResponse] =
        await Promise.all([
          fetch(`${API_URL}/reports/summary${queryParams}`, {
            headers: getAuthHeaders()
          }),
          fetch(`${API_URL}/reports/top-products${queryParams}`, {
            headers: getAuthHeaders()
          }),
          fetch(`${API_URL}/reports/sales-by-day${queryParams}`, {
            headers: getAuthHeaders()
          })
        ]);

      const summaryData = await summaryResponse.json();
      const topProductsData = await topProductsResponse.json();
      const salesByDayData = await salesByDayResponse.json();

      if (!summaryResponse.ok) {
        throw new Error(
          summaryData.message || "No se pudo cargar el resumen gerencial"
        );
      }

      if (!topProductsResponse.ok) {
        throw new Error(
          topProductsData.message || "No se pudo cargar el ranking de productos"
        );
      }

      if (!salesByDayResponse.ok) {
        throw new Error(
          salesByDayData.message || "No se pudo cargar las ventas por día"
        );
      }

      setSummary(summaryData.summary || {});
      setTopProducts(
        topProductsData.topProducts ||
          topProductsData.products ||
          topProductsData.report ||
          []
      );
      setSalesByDay(
        salesByDayData.salesByDay ||
          salesByDayData.days ||
          salesByDayData.report ||
          []
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const salesByPaymentMethod = summary?.salesByPaymentMethod || {};
  const ordersByStatus = summary?.ordersByStatus || {};

  const maxTopProductQuantity = Math.max(
    ...topProducts.map((product) => getProductQuantity(product)),
    1
  );

  const maxDailySales = Math.max(
    ...salesByDay.map((day) => getDaySales(day)),
    1
  );

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <div style={styles.logoBox}>
            <img src={logoUsilCuadradoImg} alt="USIL" style={styles.logoImage} />
          </div>

          <div>
            <h1 style={styles.title}>Reportes gerenciales</h1>
            <p style={styles.subtitle}>
              Consulta ventas, pedidos, productos más vendidos y desempeño del
              kiosko.
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <a href="/admin/pedidos" style={styles.linkButton}>
            Panel pedidos
          </a>

          <a href="/admin/productos" style={styles.linkButton}>
            Productos
          </a>

          {isAdmin && (
            <a href="/admin/usuarios" style={styles.linkButton}>
              Usuarios
            </a>
          )}

          <a href="/" style={styles.linkButton}>
            Kiosko
          </a>

          <button style={styles.refreshButton} onClick={loadReports}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.filtersCard}>
        <div>
          <h2 style={styles.sectionTitle}>Periodo de análisis</h2>
          <p style={styles.smallText}>
            Filtra la información para revisar un rango específico de ventas.
          </p>
        </div>

        <div style={styles.filters}>
          <label style={styles.filterLabel}>
            Desde
            <input
              style={styles.dateInput}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label style={styles.filterLabel}>
            Hasta
            <input
              style={styles.dateInput}
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <button style={styles.applyButton} onClick={loadReports}>
            Aplicar filtro
          </button>
        </div>
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.metrics}>
        <MetricCard
          label="Ventas totales"
          value={`S/ ${formatCurrency(summary?.totalSales)}`}
          tone="success"
        />

        <MetricCard
          label="Pedidos totales"
          value={summary?.totalOrders || 0}
          tone="primary"
        />

        <MetricCard
          label="Ticket promedio"
          value={`S/ ${formatCurrency(summary?.averageTicket)}`}
          tone="purple"
        />

        <MetricCard
          label="Productos vendidos"
          value={summary?.totalProductsSold || 0}
          tone="warning"
        />
      </section>

      <section style={styles.metrics}>
        <MetricCard
          label="Pedidos pagados"
          value={summary?.paidOrders || 0}
          tone="primary"
        />

        <MetricCard
          label="Entregados"
          value={summary?.deliveredOrders || 0}
          tone="success"
        />

        <MetricCard
          label="Pendientes"
          value={summary?.pendingOrders || 0}
          tone="warning"
        />

        <MetricCard
          label="Stock bajo"
          value={summary?.lowStockProducts || 0}
          tone="danger"
        />
      </section>

      <section style={styles.layout}>
        <section style={styles.cardLarge}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Productos más vendidos</h2>
              <p style={styles.smallText}>
                Ranking de productos con mayor salida en el periodo.
              </p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <EmptyBox text="No hay productos vendidos en este periodo." />
          ) : (
            <div style={styles.rankingList}>
              {topProducts.map((product, index) => {
                const quantity = getProductQuantity(product);
                const sales = getProductSales(product);
                const percent = Math.max(
                  6,
                  Math.round((quantity / maxTopProductQuantity) * 100)
                );

                return (
                  <article key={`${getProductName(product)}-${index}`} style={styles.rankingItem}>
                    <div style={styles.rankNumber}>{index + 1}</div>

                    <div style={styles.rankingContent}>
                      <div style={styles.rankingTop}>
                        <strong>{getProductName(product)}</strong>
                        <span>{quantity} vendidos</span>
                      </div>

                      <div style={styles.progressTrack}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${percent}%`
                          }}
                        />
                      </div>

                      <div style={styles.rankingBottom}>
                        <span>Venta estimada</span>
                        <strong>S/ {formatCurrency(sales)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Ventas por método de pago</h2>

          {Object.keys(salesByPaymentMethod).length === 0 ? (
            <EmptyBox text="No hay ventas por método de pago." />
          ) : (
            <div style={styles.paymentList}>
              {Object.entries(salesByPaymentMethod).map(([method, amount]) => (
                <div key={method} style={styles.paymentRow}>
                  <span>{formatPaymentMethod(method)}</span>
                  <strong>S/ {formatCurrency(amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Pedidos por estado</h2>

          {Object.keys(ordersByStatus).length === 0 ? (
            <EmptyBox text="No hay pedidos registrados." />
          ) : (
            <div style={styles.statusList}>
              {Object.entries(ordersByStatus).map(([status, quantity]) => (
                <div key={status} style={styles.statusRow}>
                  <span>{formatStatus(status)}</span>
                  <strong>{quantity}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section style={styles.cardFull}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Ventas por día</h2>
            <p style={styles.smallText}>
              Evolución diaria de ventas durante el periodo seleccionado.
            </p>
          </div>
        </div>

        {salesByDay.length === 0 ? (
          <EmptyBox text="No hay ventas diarias registradas en este periodo." />
        ) : (
          <div style={styles.dailyChart}>
            {salesByDay.map((day, index) => {
              const sales = getDaySales(day);
              const orders = getDayOrders(day);
              const percent = Math.max(8, Math.round((sales / maxDailySales) * 100));

              return (
                <article key={`${getDayLabel(day)}-${index}`} style={styles.dayRow}>
                  <span style={styles.dayLabel}>{formatDayLabel(getDayLabel(day))}</span>

                  <div style={styles.dayBarTrack}>
                    <div
                      style={{
                        ...styles.dayBarFill,
                        width: `${percent}%`
                      }}
                    />
                  </div>

                  <div style={styles.dayValues}>
                    <strong>S/ {formatCurrency(sales)}</strong>
                    <span>{orders} pedidos</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({ label, value, tone = "primary" }) {
  const toneStyle = {
    primary: {
      background: COLORS.white,
      color: COLORS.primary,
      border: COLORS.border
    },
    success: {
      background: COLORS.successLight,
      color: COLORS.success,
      border: "#BFE8CE"
    },
    warning: {
      background: COLORS.warningLight,
      color: "#8A6200",
      border: "#F5D36B"
    },
    danger: {
      background: COLORS.dangerLight,
      color: COLORS.danger,
      border: "#FFC7D0"
    },
    purple: {
      background: COLORS.purpleLight,
      color: COLORS.purple,
      border: "#EAC6F1"
    }
  };

  const selectedTone = toneStyle[tone] || toneStyle.primary;

  return (
    <article
      style={{
        ...styles.metricCard,
        background: selectedTone.background,
        color: selectedTone.color,
        border: `1px solid ${selectedTone.border}`
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyBox({ text }) {
  return <div style={styles.emptyBox}>{text}</div>;
}

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
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

function getProductName(product) {
  return (
    product.name ||
    product.productName ||
    product.product ||
    product.Product?.name ||
    "Producto"
  );
}

function getProductQuantity(product) {
  return Number(
    product.quantity ||
      product.totalQuantity ||
      product.quantitySold ||
      product.totalSold ||
      product.soldUnits ||
      0
  );
}

function getProductSales(product) {
  return Number(
    product.totalSales ||
      product.sales ||
      product.revenue ||
      product.totalRevenue ||
      product.amount ||
      0
  );
}

function getDayLabel(day) {
  return day.date || day.day || day.createdAt || day.orderDate || "";
}

function getDaySales(day) {
  return Number(day.totalSales || day.sales || day.revenue || day.amount || 0);
}

function getDayOrders(day) {
  return Number(day.totalOrders || day.orders || day.orderCount || day.count || 0);
}

function formatDayLabel(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short"
  });
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.background,
    fontFamily: "Arial, sans-serif",
    color: COLORS.text,
    padding: "32px",
    boxSizing: "border-box"
  },
  header: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    marginBottom: "24px",
    flexWrap: "wrap",
    boxSizing: "border-box"
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },
  logoBox: {
    width: "78px",
    height: "78px",
    borderRadius: "22px",
    overflow: "hidden",
    background: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 10px 24px rgba(11, 46, 107, 0.13)",
    flexShrink: 0
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  title: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "42px"
  },
  subtitle: {
    margin: "8px 0 0",
    color: COLORS.textSoft,
    fontSize: "17px"
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  linkButton: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "13px 20px",
    fontWeight: "900",
    fontSize: "15px",
    textDecoration: "none",
    boxSizing: "border-box"
  },
  refreshButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "13px 20px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  logoutButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "13px 20px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  filtersCard: {
    background: COLORS.white,
    borderRadius: "26px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    boxSizing: "border-box"
  },
  filters: {
    display: "flex",
    gap: "12px",
    alignItems: "end",
    flexWrap: "wrap"
  },
  filterLabel: {
    display: "grid",
    gap: "7px",
    color: COLORS.text,
    fontWeight: "900"
  },
  dateInput: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "12px 14px",
    fontSize: "15px",
    color: COLORS.primary,
    fontWeight: "800",
    boxSizing: "border-box"
  },
  applyButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "13px 22px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  message: {
    background: COLORS.dangerLight,
    color: COLORS.danger,
    border: "1px solid #FFC7D0",
    borderRadius: "18px",
    padding: "14px 18px",
    fontWeight: "800",
    marginBottom: "20px",
    boxSizing: "border-box"
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "18px"
  },
  metricCard: {
    borderRadius: "22px",
    padding: "20px",
    display: "grid",
    gap: "8px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    boxSizing: "border-box"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.65fr) minmax(320px, 0.65fr)",
    gap: "22px",
    alignItems: "start",
    marginTop: "22px",
    width: "100%",
    boxSizing: "border-box"
  },
  card: {
    background: COLORS.white,
    borderRadius: "26px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    boxSizing: "border-box"
  },
  cardLarge: {
    background: COLORS.white,
    borderRadius: "26px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    boxSizing: "border-box"
  },
  cardFull: {
    background: COLORS.white,
    borderRadius: "26px",
    border: `1px solid ${COLORS.border}`,
    padding: "22px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    marginTop: "22px",
    boxSizing: "border-box"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    marginBottom: "18px",
    flexWrap: "wrap"
  },
  sectionTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "28px"
  },
  smallText: {
    margin: "7px 0 0",
    color: COLORS.textSoft,
    fontSize: "14px"
  },
  emptyBox: {
    background: COLORS.background,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: "20px",
    padding: "28px",
    textAlign: "center",
    color: COLORS.textSoft,
    fontWeight: "800",
    boxSizing: "border-box"
  },
  rankingList: {
    display: "grid",
    gap: "14px"
  },
  rankingItem: {
    display: "grid",
    gridTemplateColumns: "46px minmax(0, 1fr)",
    gap: "14px",
    alignItems: "center",
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "14px",
    boxSizing: "border-box"
  },
  rankNumber: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "20px"
  },
  rankingContent: {
    display: "grid",
    gap: "9px",
    minWidth: 0
  },
  rankingTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: COLORS.primary,
    fontSize: "16px"
  },
  progressTrack: {
    width: "100%",
    height: "12px",
    background: COLORS.white,
    borderRadius: "999px",
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`
  },
  progressFill: {
    height: "100%",
    background: COLORS.success,
    borderRadius: "999px"
  },
  rankingBottom: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: COLORS.textSoft,
    fontSize: "14px"
  },
  paymentList: {
    display: "grid",
    gap: "12px",
    marginTop: "16px"
  },
  paymentRow: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    color: COLORS.primary,
    fontWeight: "900"
  },
  statusList: {
    display: "grid",
    gap: "12px",
    marginTop: "16px"
  },
  statusRow: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    color: COLORS.primary,
    fontWeight: "900"
  },
  dailyChart: {
    display: "grid",
    gap: "14px",
    marginTop: "18px"
  },
  dayRow: {
    display: "grid",
    gridTemplateColumns: "120px minmax(0, 1fr) 160px",
    gap: "16px",
    alignItems: "center",
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px",
    boxSizing: "border-box"
  },
  dayLabel: {
    color: COLORS.primary,
    fontWeight: "900"
  },
  dayBarTrack: {
    height: "18px",
    background: COLORS.white,
    borderRadius: "999px",
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`
  },
  dayBarFill: {
    height: "100%",
    background: COLORS.primary,
    borderRadius: "999px"
  },
  dayValues: {
    display: "grid",
    gap: "3px",
    color: COLORS.primary,
    textAlign: "right"
  }
};
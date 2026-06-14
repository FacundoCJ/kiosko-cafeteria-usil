import React, { useEffect, useMemo, useState } from "react";
import logoUsil from "../assets/branding/logo-usil.png";

import {
  getAuthHeaders,
  getCurrentUser,
  logout
} from "../services/auth.service.js";

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
  warningLight: "#FFF4D6",
  dangerLight: "#FFE8EB",
  successLight: "#E8F8EF"
};

const STATUS_INFO = {
  pendiente: {
    label: "Pendiente",
    color: COLORS.warning,
    background: COLORS.warningLight
  },
  pagado: {
    label: "Pagado",
    color: COLORS.secondary,
    background: COLORS.primaryLight
  },
  preparando: {
    label: "En preparación",
    color: COLORS.warning,
    background: COLORS.warningLight
  },
  listo: {
    label: "Listo",
    color: COLORS.success,
    background: COLORS.successLight
  },
  entregado: {
    label: "Entregado",
    color: COLORS.primary,
    background: COLORS.primaryLight
  },
  anulado: {
    label: "Anulado",
    color: COLORS.danger,
    background: COLORS.dangerLight
  }
};

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos los estados" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagados" },
  { value: "preparando", label: "En preparación" },
  { value: "listo", label: "Listos" },
  { value: "entregado", label: "Entregados" },
  { value: "anulado", label: "Anulados" }
];

const NEXT_STATUS = {
  pendiente: "pagado",
  pagado: "preparando",
  preparando: "listo",
  listo: "entregado"
};

const ACTIVE_KITCHEN_STATUSES = ["pagado", "preparando", "listo"];

const getTodayInputValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const formatCurrency = (value) => {
  return `S/ ${Number(value || 0).toFixed(2)}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

const formatStatus = (status) => {
  return STATUS_INFO[status]?.label || status;
};

const formatAction = (action) => {
  const actions = {
    PEDIDO_CREADO: "Pedido creado",
    CAMBIO_ESTADO: "Cambio de estado",
    PEDIDO_ANULADO: "Pedido anulado"
  };

  return actions[action] || action;
};

const getStatusStyle = (status) => {
  const info = STATUS_INFO[status] || STATUS_INFO.pendiente;

  return {
    ...styles.statusBadge,
    background: info.background,
    color: info.color,
    borderColor: info.color
  };
};

const getNextStatusForRole = (order, role) => {
  if (order.status === "anulado" || order.status === "entregado") {
    return null;
  }

  if (role === "COCINA") {
    if (order.status === "pagado") return "preparando";
    if (order.status === "preparando") return "listo";
    return null;
  }

  return NEXT_STATUS[order.status] || null;
};

const getNextStatusLabel = (nextStatus) => {
  const labels = {
    pagado: "Marcar pagado",
    preparando: "Preparar",
    listo: "Marcar listo",
    entregado: "Entregar"
  };

  return labels[nextStatus] || "Actualizar";
};

const escapeCsv = (value) => {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
};

function OrderManagement() {
  const currentUser = getCurrentUser();

  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue());
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isKitchenUser = currentUser?.role === "COCINA";
  const canManageUsers = currentUser?.role === "ADMIN";
  const canManageProducts = ["ADMIN", "CAFETERIA"].includes(currentUser?.role);
  const canViewReports = ["ADMIN", "CAFETERIA"].includes(currentUser?.role);
  const canCancelOrders = ["ADMIN", "CAFETERIA"].includes(currentUser?.role);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams();

      if (selectedDate) {
        params.append("date", selectedDate);
      }

      if (!isKitchenUser && selectedStatus !== "todos") {
        params.append("status", selectedStatus);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_URL}/orders?${queryString}`
        : `${API_URL}/orders`;

      const response = await fetch(url, {
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
  }, [selectedDate, selectedStatus]);

  const visibleOrders = useMemo(() => {
    if (isKitchenUser) {
      return orders.filter((order) =>
        ACTIVE_KITCHEN_STATUSES.includes(order.status)
      );
    }

    return orders;
  }, [orders, isKitchenUser]);

  const groupedOrders = useMemo(() => {
    return {
      pendiente: visibleOrders.filter((order) => order.status === "pendiente"),
      pagado: visibleOrders.filter((order) => order.status === "pagado"),
      preparando: visibleOrders.filter((order) => order.status === "preparando"),
      listo: visibleOrders.filter((order) => order.status === "listo"),
      entregado: visibleOrders.filter((order) => order.status === "entregado"),
      anulado: visibleOrders.filter((order) => order.status === "anulado")
    };
  }, [visibleOrders]);

  const summary = useMemo(() => {
    const paidStatuses = ["pagado", "preparando", "listo", "entregado"];

    const validSalesOrders = visibleOrders.filter((order) =>
      paidStatuses.includes(order.status)
    );

    return {
      totalOrders: visibleOrders.length,
      activeOrders: visibleOrders.filter((order) =>
        ACTIVE_KITCHEN_STATUSES.includes(order.status)
      ).length,
      readyOrders: groupedOrders.listo.length,
      cancelledOrders: groupedOrders.anulado.length,
      totalSales: validSalesOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      )
    };
  }, [visibleOrders, groupedOrders]);

  const updateOrderStatus = async (order, nextStatus) => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/orders/${order.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: nextStatus,
          reason: `Actualización desde panel por ${currentUser?.name || "usuario"}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el pedido");
      }

      setMessage(
        `Pedido ${data.order.orderNumber} actualizado a ${formatStatus(
          data.order.status
        )}.`
      );

      await loadOrders();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al actualizar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (order) => {
    const reason = window.prompt(
      `Motivo de anulación para el pedido ${order.orderNumber}:`
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setMessage("Debes ingresar un motivo para anular el pedido.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/orders/${order.id}/cancel`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reason: reason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo anular el pedido");
      }

      setMessage(`Pedido ${data.order.orderNumber} anulado correctamente.`);
      await loadOrders();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al anular el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (order) => {
    try {
      setHistoryLoading(true);
      setHistoryModal({
        order,
        actions: []
      });

      const response = await fetch(`${API_URL}/orders/${order.id}/actions`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar el historial");
      }

      setHistoryModal({
        order,
        actions: data.actions || []
      });
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cargar historial.");
      setHistoryModal(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const exportOrdersCsv = () => {
    if (visibleOrders.length === 0) {
      setMessage("No hay pedidos para exportar.");
      return;
    }

    const headers = [
      "Numero de pedido",
      "Cliente",
      "Estado",
      "Metodo de pago",
      "Total",
      "Fecha",
      "Productos"
    ];

    const rows = visibleOrders.map((order) => [
      order.orderNumber,
      order.customerName,
      formatStatus(order.status),
      order.paymentMethod,
      Number(order.total || 0).toFixed(2),
      formatDateTime(order.createdAt),
      (order.items || [])
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(" | ")
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `pedidos-${selectedDate || "todos"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    setMessage("Reporte CSV exportado correctamente.");
  };

  const resetFilters = () => {
    setSelectedDate(getTodayInputValue());
    setSelectedStatus("todos");
  };

  const columnsToShow = isKitchenUser
    ? [
        { key: "pagado", title: "Pagados" },
        { key: "preparando", title: "En preparación" },
        { key: "listo", title: "Listos para entrega" }
      ]
    : [
        { key: "pendiente", title: "Pendientes" },
        { key: "pagado", title: "Pagados" },
        { key: "preparando", title: "En preparación" },
        { key: "listo", title: "Listos" },
        { key: "entregado", title: "Entregados" },
        { key: "anulado", title: "Anulados" }
      ];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brandBlock}>
          <img src={logoUsil} alt="USIL" style={styles.logoImage} />

          <div>
            <h1 style={styles.title}>
              {isKitchenUser ? "Panel de cocina" : "Panel de pedidos"}
            </h1>

            <p style={styles.subtitle}>
              {isKitchenUser
                ? "Vista enfocada solo en pedidos pagados, en preparación y listos."
                : "Gestiona pedidos, anulación, historial y cierre operativo diario."}
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          {canManageUsers && (
            <a href="/admin/usuarios" style={styles.linkButton}>
              Usuarios
            </a>
          )}

          {canViewReports && (
            <a href="/admin/reportes" style={styles.linkButton}>
              Reportes
            </a>
          )}

          {canManageProducts && (
            <a href="/admin/productos" style={styles.linkButton}>
              Productos
            </a>
          )}

          <a href="/pantalla-pedidos" style={styles.linkButton}>
            Pantalla retiro
          </a>

          <a href="/" style={styles.linkButton}>
            Kiosko
          </a>

          <button style={styles.refreshButton} onClick={loadOrders}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.filtersCard}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            Día de operación
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              style={styles.input}
            />
          </label>

          {!isKitchenUser && (
            <label style={styles.label}>
              Estado
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                style={styles.input}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div style={styles.filterActions}>
          <button style={styles.secondaryButton} onClick={resetFilters}>
            Hoy
          </button>

          <button style={styles.exportButton} onClick={exportOrdersCsv}>
            Exportar CSV
          </button>
        </div>
      </section>

      <section style={styles.metrics}>
        <article style={styles.metricCard}>
          <span>Pedidos mostrados</span>
          <strong>{summary.totalOrders}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Activos</span>
          <strong>{summary.activeOrders}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Listos</span>
          <strong>{summary.readyOrders}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Anulados</span>
          <strong>{summary.cancelledOrders}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Ventas válidas</span>
          <strong>{formatCurrency(summary.totalSales)}</strong>
        </article>
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.columns}>
        {columnsToShow.map((column) => (
          <OrderColumn
            key={column.key}
            title={column.title}
            orders={groupedOrders[column.key]}
            currentUser={currentUser}
            canCancelOrders={canCancelOrders}
            loading={loading}
            onNextStatus={updateOrderStatus}
            onCancel={cancelOrder}
            onHistory={openHistory}
          />
        ))}
      </section>

      {historyModal && (
        <HistoryModal
          order={historyModal.order}
          actions={historyModal.actions}
          loading={historyLoading}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </main>
  );
}

function OrderColumn({
  title,
  orders,
  currentUser,
  canCancelOrders,
  loading,
  onNextStatus,
  onCancel,
  onHistory
}) {
  return (
    <section style={styles.column}>
      <h2 style={styles.columnTitle}>{title}</h2>

      {orders.length === 0 ? (
        <p style={styles.emptyColumn}>Sin pedidos.</p>
      ) : (
        orders.map((order) => {
          const nextStatus = getNextStatusForRole(order, currentUser?.role);

          return (
            <article key={order.id} style={styles.orderCard}>
              <div style={styles.orderTop}>
                <strong style={styles.orderNumber}>{order.orderNumber}</strong>
                <span style={getStatusStyle(order.status)}>
                  {formatStatus(order.status)}
                </span>
              </div>

              <p style={styles.clientName}>{order.customerName}</p>

              <div style={styles.orderMeta}>
                <span>{formatCurrency(order.total)}</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>

              <ul style={styles.itemList}>
                {(order.items || []).map((item) => (
                  <li key={`${order.id}-${item.id}`}>
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>

              <p style={styles.paymentText}>Pago: {order.paymentMethod}</p>

              <div style={styles.orderActions}>
                {nextStatus && (
                  <button
                    style={styles.orderButton}
                    disabled={loading}
                    onClick={() => onNextStatus(order, nextStatus)}
                  >
                    {getNextStatusLabel(nextStatus)}
                  </button>
                )}

                <button
                  style={styles.historyButton}
                  disabled={loading}
                  onClick={() => onHistory(order)}
                >
                  Historial
                </button>

                {canCancelOrders &&
                  order.status !== "anulado" &&
                  order.status !== "entregado" && (
                    <button
                      style={styles.cancelButton}
                      disabled={loading}
                      onClick={() => onCancel(order)}
                    >
                      Anular
                    </button>
                  )}
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}

function HistoryModal({ order, actions, loading, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <section style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Historial del pedido</h2>
            <p style={styles.modalSubtitle}>{order.orderNumber}</p>
          </div>

          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {loading ? (
          <p style={styles.emptyColumn}>Cargando historial...</p>
        ) : actions.length === 0 ? (
          <p style={styles.emptyColumn}>Sin acciones registradas.</p>
        ) : (
          <div style={styles.timeline}>
            {actions.map((action) => (
              <article key={action.id} style={styles.timelineItem}>
                <div style={styles.timelineDot} />

                <div style={styles.timelineContent}>
                  <strong>{formatAction(action.action)}</strong>

                  <span style={styles.timelineDate}>
                    {formatDateTime(action.createdAt)}
                  </span>

                  <p style={styles.timelineText}>
                    Usuario: {action.userName || "Sistema"}
                    {action.userRole ? ` (${action.userRole})` : ""}
                  </p>

                  {(action.previousStatus || action.newStatus) && (
                    <p style={styles.timelineText}>
                      Estado: {action.previousStatus || "-"} →{" "}
                      {action.newStatus || "-"}
                    </p>
                  )}

                  {action.reason && (
                    <p style={styles.reasonBox}>Motivo: {action.reason}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.background,
    fontFamily: "Arial, sans-serif",
    padding: "28px",
    color: COLORS.text
  },
  header: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },
  logoImage: {
    width: "86px",
    height: "86px",
    objectFit: "contain",
    background: COLORS.white,
    borderRadius: "22px",
    border: `1px solid ${COLORS.border}`,
    padding: "8px"
  },
  title: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "42px"
  },
  subtitle: {
    margin: "8px 0 0",
    color: COLORS.textSoft,
    fontSize: "17px",
    maxWidth: "620px"
  },
  headerActions: {
    display: "flex",
    gap: "10px",
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
    padding: "12px 18px",
    fontWeight: "800",
    fontSize: "14px"
  },
  refreshButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "12px 18px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer"
  },
  logoutButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "12px 18px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer"
  },
  filtersCard: {
    background: COLORS.white,
    borderRadius: "22px",
    border: `1px solid ${COLORS.border}`,
    padding: "18px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "end",
    flexWrap: "wrap",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  filterGroup: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap"
  },
  label: {
    display: "grid",
    gap: "8px",
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: "14px"
  },
  input: {
    minWidth: "210px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "13px 14px",
    fontSize: "15px",
    color: COLORS.text,
    background: COLORS.white
  },
  filterActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  secondaryButton: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "13px 18px",
    fontWeight: "900",
    cursor: "pointer"
  },
  exportButton: {
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "14px",
    padding: "13px 18px",
    fontWeight: "900",
    cursor: "pointer"
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "18px"
  },
  metricCard: {
    background: COLORS.white,
    borderRadius: "20px",
    border: `1px solid ${COLORS.border}`,
    padding: "18px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    display: "grid",
    gap: "6px"
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
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
    alignItems: "start"
  },
  column: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "24px",
    padding: "18px",
    minHeight: "340px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  columnTitle: {
    margin: "0 0 14px",
    color: COLORS.primary,
    fontSize: "23px"
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
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center"
  },
  orderNumber: {
    color: COLORS.primary,
    fontSize: "20px"
  },
  statusBadge: {
    border: "1px solid",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },
  clientName: {
    margin: "10px 0 8px",
    color: COLORS.textSoft,
    fontWeight: "800"
  },
  orderMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: "14px",
    flexWrap: "wrap"
  },
  itemList: {
    margin: "12px 0",
    paddingLeft: "20px",
    color: COLORS.text
  },
  paymentText: {
    color: COLORS.primary,
    fontWeight: "800",
    margin: "8px 0 12px"
  },
  orderActions: {
    display: "grid",
    gap: "8px"
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
  historyButton: {
    width: "100%",
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "14px",
    padding: "12px",
    fontWeight: "900",
    cursor: "pointer"
  },
  cancelButton: {
    width: "100%",
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "14px",
    padding: "12px",
    fontWeight: "900",
    cursor: "pointer"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 20, 40, 0.54)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 1000
  },
  modal: {
    width: "min(680px, 100%)",
    maxHeight: "86vh",
    overflow: "auto",
    background: COLORS.white,
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 28px 90px rgba(0,0,0,0.24)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: "18px",
    marginBottom: "18px"
  },
  modalTitle: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "30px"
  },
  modalSubtitle: {
    margin: "6px 0 0",
    color: COLORS.textSoft,
    fontWeight: "900"
  },
  closeButton: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "none",
    background: COLORS.danger,
    color: COLORS.white,
    fontSize: "26px",
    fontWeight: "900",
    cursor: "pointer"
  },
  timeline: {
    display: "grid",
    gap: "14px"
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: "12px",
    alignItems: "start"
  },
  timelineDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: COLORS.primary,
    marginTop: "6px"
  },
  timelineContent: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "16px",
    display: "grid",
    gap: "6px"
  },
  timelineDate: {
    color: COLORS.textSoft,
    fontSize: "13px",
    fontWeight: "800"
  },
  timelineText: {
    margin: 0,
    color: COLORS.text
  },
  reasonBox: {
    margin: "4px 0 0",
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "10px",
    color: COLORS.primary,
    fontWeight: "800"
  }
};

export default OrderManagement;
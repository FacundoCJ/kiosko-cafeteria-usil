import React, { useEffect, useMemo, useState } from "react";
import logoUsil from "../assets/branding/logo-usil.png";
import * as XLSX from "xlsx";

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

const formatPaymentMethod = (method) => {
  const methods = {
    pendiente: "Pendiente",
    yape: "Yape",
    plin: "Plin",
    tarjeta: "Tarjeta",
    qr: "QR"
  };

  return methods[method] || method || "Pendiente";
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

const downloadCsv = (filename, rows) => {
  const csvContent = rows
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

const createWorksheet = (rows, columnWidths = []) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet["!cols"] = columnWidths.map((width) => ({
    wch: width
  }));

  return worksheet;
};

const exportDailyCloseExcelFile = (dailyClose) => {
  const totals = dailyClose.totals || {};
  const ordersByStatus = dailyClose.ordersByStatus || {};
  const salesByPaymentMethod = dailyClose.salesByPaymentMethod || {};
  const productsSold = dailyClose.productsSold || [];
  const orders = dailyClose.orders || [];

  const workbook = XLSX.utils.book_new();

  const resumenRows = [
    ["KIOSKO CAFETERÍA USIL"],
    ["CIERRE DE DÍA"],
    [],
    ["Fecha de operación", dailyClose.date],
    ["Fecha de generación", formatDateTime(dailyClose.generatedAt)],
    [],
    ["Indicador", "Valor"],
    ["Total de pedidos", totals.totalOrders || 0],
    ["Pedidos válidos para venta", totals.validSalesOrders || 0],
    ["Pedidos anulados", totals.cancelledOrders || 0],
    ["Pedidos entregados", totals.deliveredOrders || 0],
    ["Ventas válidas", Number(totals.totalSales || 0)],
    ["Ticket promedio", Number(totals.averageTicket || 0)],
    ["Productos vendidos", totals.totalProductsSold || 0],
    [],
    ["Validación automática"],
    ["Total calculado de ventas", { f: "SUM(DetallePedidos!E2:E500)" }],
    ["Total pedidos en detalle", { f: "COUNTA(DetallePedidos!A2:A500)" }]
  ];

  const resumenSheet = createWorksheet(resumenRows, [30, 24]);
  resumenSheet["B12"].z = '"S/ "#,##0.00';
  resumenSheet["B13"].z = '"S/ "#,##0.00';
  resumenSheet["B17"].z = '"S/ "#,##0.00';

  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  const estadoRows = [
    ["Estado", "Cantidad"],
    ["Pendiente", ordersByStatus.pendiente || 0],
    ["Pagado", ordersByStatus.pagado || 0],
    ["En preparación", ordersByStatus.preparando || 0],
    ["Listo", ordersByStatus.listo || 0],
    ["Entregado", ordersByStatus.entregado || 0],
    ["Anulado", ordersByStatus.anulado || 0],
    ["Total", { f: "SUM(B2:B7)" }]
  ];

  const estadoSheet = createWorksheet(estadoRows, [24, 16]);
  XLSX.utils.book_append_sheet(workbook, estadoSheet, "Pedidos por estado");

  const metodosRows = [
    ["Método de pago", "Total vendido"],
    ...Object.entries(salesByPaymentMethod).map(([method, total]) => [
      formatPaymentMethod(method),
      Number(total || 0)
    ]),
    [],
    ["Total", { f: "SUM(B2:B100)" }]
  ];

  const metodosSheet = createWorksheet(metodosRows, [24, 18]);

  for (let rowIndex = 2; rowIndex <= 100; rowIndex += 1) {
    const cell = metodosSheet[`B${rowIndex}`];

    if (cell) {
      cell.z = '"S/ "#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(workbook, metodosSheet, "Métodos de pago");

  const productosRows = [
    ["Producto", "Categoría", "Cantidad vendida", "Total"],
    ...productsSold.map((product) => [
      product.name,
      product.category,
      Number(product.quantity || 0),
      Number(product.total || 0)
    ]),
    [],
    ["TOTAL", "", { f: "SUM(C2:C500)" }, { f: "SUM(D2:D500)" }]
  ];

  const productosSheet = createWorksheet(productosRows, [32, 24, 18, 18]);

  for (let rowIndex = 2; rowIndex <= 500; rowIndex += 1) {
    const cell = productosSheet[`D${rowIndex}`];

    if (cell) {
      cell.z = '"S/ "#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(workbook, productosSheet, "Productos vendidos");

  const detalleRows = [
    [
      "Pedido",
      "Cliente",
      "Estado",
      "Método de pago",
      "Total",
      "Fecha",
      "Productos"
    ],
    ...orders.map((order) => [
      order.orderNumber,
      order.customerName,
      formatStatus(order.status),
      formatPaymentMethod(order.paymentMethod),
      Number(order.status === "anulado" ? 0 : order.total || 0),
      formatDateTime(order.createdAt),
      (order.items || [])
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(" | ")
    ])
  ];

  const detalleSheet = createWorksheet(detalleRows, [
    16,
    28,
    18,
    18,
    14,
    24,
    48
  ]);

  for (let rowIndex = 2; rowIndex <= 500; rowIndex += 1) {
    const cell = detalleSheet[`E${rowIndex}`];

    if (cell) {
      cell.z = '"S/ "#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(workbook, detalleSheet, "DetallePedidos");

  XLSX.writeFile(workbook, `cierre-dia-${dailyClose.date}.xlsx`);
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
  const [dailyCloseModal, setDailyCloseModal] = useState(null);
  const [dailyCloseLoading, setDailyCloseLoading] = useState(false);

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

  const openDailyClose = async () => {
    try {
      setDailyCloseLoading(true);
      setMessage("");

      const dateParam = selectedDate || getTodayInputValue();

      const response = await fetch(
        `${API_URL}/reports/daily-close?date=${dateParam}`,
        {
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo generar el cierre de día");
      }

      setDailyCloseModal(data.dailyClose);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al generar cierre de día.");
    } finally {
      setDailyCloseLoading(false);
    }
  };

  const exportOrdersExcel = () => {
  if (visibleOrders.length === 0) {
    setMessage("No hay pedidos para exportar.");
    return;
  }

  const workbook = XLSX.utils.book_new();

  const resumenRows = [
    ["KIOSKO CAFETERÍA USIL"],
    ["REPORTE DE PEDIDOS FILTRADOS"],
    [],
    ["Fecha de operación", selectedDate || "Todos"],
    ["Estado filtrado", selectedStatus === "todos" ? "Todos los estados" : formatStatus(selectedStatus)],
    ["Generado", formatDateTime(new Date())],
    [],
    ["Indicador", "Valor"],
    ["Pedidos mostrados", visibleOrders.length],
    ["Pedidos activos", summary.activeOrders],
    ["Pedidos listos", summary.readyOrders],
    ["Pedidos anulados", summary.cancelledOrders],
    ["Ventas válidas", Number(summary.totalSales || 0)]
  ];

  const resumenSheet = createWorksheet(resumenRows, [32, 28]);
  resumenSheet["B13"].z = '"S/ "#,##0.00';

  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  const detalleRows = [
    [
      "Pedido",
      "Cliente",
      "Estado",
      "Método de pago",
      "Total",
      "Fecha",
      "Productos"
    ],
    ...visibleOrders.map((order) => [
      order.orderNumber,
      order.customerName,
      formatStatus(order.status),
      formatPaymentMethod(order.paymentMethod),
      Number(order.status === "anulado" ? 0 : order.total || 0),
      formatDateTime(order.createdAt),
      (order.items || [])
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(" | ")
    ]),
    [],
    [
      "TOTAL",
      "",
      "",
      "",
      { f: "SUM(E2:E500)" },
      "",
      ""
    ]
  ];

  const detalleSheet = createWorksheet(detalleRows, [
    16,
    28,
    18,
    18,
    14,
    24,
    52
  ]);

  for (let rowIndex = 2; rowIndex <= 500; rowIndex += 1) {
    const cell = detalleSheet[`E${rowIndex}`];

    if (cell) {
      cell.z = '"S/ "#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(workbook, detalleSheet, "DetallePedidos");

  const estados = {
    pendiente: 0,
    pagado: 0,
    preparando: 0,
    listo: 0,
    entregado: 0,
    anulado: 0
  };

  visibleOrders.forEach((order) => {
    estados[order.status] = (estados[order.status] || 0) + 1;
  });

  const estadosRows = [
    ["Estado", "Cantidad"],
    ["Pendiente", estados.pendiente],
    ["Pagado", estados.pagado],
    ["En preparación", estados.preparando],
    ["Listo", estados.listo],
    ["Entregado", estados.entregado],
    ["Anulado", estados.anulado],
    ["Total", { f: "SUM(B2:B7)" }]
  ];

  const estadosSheet = createWorksheet(estadosRows, [24, 16]);
  XLSX.utils.book_append_sheet(workbook, estadosSheet, "Pedidos por estado");

  XLSX.writeFile(
    workbook,
    `pedidos-${selectedDate || "todos"}-${selectedStatus}.xlsx`
  );

  setMessage("Reporte Excel de pedidos exportado correctamente.");
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

{canManageProducts && (
  <a href="/admin/stock" style={styles.linkButton}>
    Stock
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

          {canViewReports && (
            <button
              style={styles.dailyCloseButton}
              onClick={openDailyClose}
              disabled={dailyCloseLoading}
            >
              {dailyCloseLoading ? "Generando..." : "Cierre de día"}
            </button>
          )}

          <button style={styles.exportButton} onClick={exportOrdersExcel}>
  Exportar pedidos Excel
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

      {dailyCloseModal && (
        <DailyCloseModal
          dailyClose={dailyCloseModal}
          onClose={() => setDailyCloseModal(null)}
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

              <p style={styles.paymentText}>
                Pago: {formatPaymentMethod(order.paymentMethod)}
              </p>

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

function DailyCloseModal({ dailyClose, onClose }) {
  const totals = dailyClose.totals || {};
  const ordersByStatus = dailyClose.ordersByStatus || {};
  const salesByPaymentMethod = dailyClose.salesByPaymentMethod || {};
  const productsSold = dailyClose.productsSold || [];
  const orders = dailyClose.orders || [];

  const exportDailyCloseExcel = () => {
  exportDailyCloseExcelFile(dailyClose);
};

  return (
    <div style={styles.modalOverlay}>
      <section style={styles.dailyCloseModal}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Cierre de día</h2>
            <p style={styles.modalSubtitle}>
              Fecha: {dailyClose.date} · Generado:{" "}
              {formatDateTime(dailyClose.generatedAt)}
            </p>
          </div>

          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <section style={styles.dailyCloseGrid}>
          <article style={styles.dailyMetric}>
            <span>Total pedidos</span>
            <strong>{totals.totalOrders || 0}</strong>
          </article>

          <article style={styles.dailyMetric}>
            <span>Ventas válidas</span>
            <strong>{formatCurrency(totals.totalSales)}</strong>
          </article>

          <article style={styles.dailyMetric}>
            <span>Ticket promedio</span>
            <strong>{formatCurrency(totals.averageTicket)}</strong>
          </article>

          <article style={styles.dailyMetric}>
            <span>Productos vendidos</span>
            <strong>{totals.totalProductsSold || 0}</strong>
          </article>

          <article style={styles.dailyMetric}>
            <span>Anulados</span>
            <strong>{totals.cancelledOrders || 0}</strong>
          </article>

          <article style={styles.dailyMetric}>
            <span>Entregados</span>
            <strong>{totals.deliveredOrders || 0}</strong>
          </article>
        </section>

        <section style={styles.dailySection}>
          <h3 style={styles.dailyTitle}>Pedidos por estado</h3>

          <div style={styles.statusSummaryGrid}>
            {Object.entries(STATUS_INFO).map(([status, info]) => (
              <div key={status} style={styles.statusSummaryItem}>
                <span>{info.label}</span>
                <strong>{ordersByStatus[status] || 0}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.dailySection}>
          <h3 style={styles.dailyTitle}>Ventas por método de pago</h3>

          {Object.keys(salesByPaymentMethod).length === 0 ? (
            <p style={styles.emptyColumn}>Sin ventas válidas registradas.</p>
          ) : (
            <div style={styles.paymentSummary}>
              {Object.entries(salesByPaymentMethod).map(([method, total]) => (
                <div key={method} style={styles.paymentRow}>
                  <span>{formatPaymentMethod(method)}</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.dailySection}>
          <h3 style={styles.dailyTitle}>Productos vendidos</h3>

          {productsSold.length === 0 ? (
            <p style={styles.emptyColumn}>Sin productos vendidos.</p>
          ) : (
            <div style={styles.productsTable}>
              {productsSold.map((product) => (
                <div key={product.productId} style={styles.productRow}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                  </div>

                  <div style={styles.productNumbers}>
                    <strong>{product.quantity} und.</strong>
                    <span>{formatCurrency(product.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.dailySection}>
          <h3 style={styles.dailyTitle}>Detalle de pedidos</h3>

          {orders.length === 0 ? (
            <p style={styles.emptyColumn}>No hubo pedidos en este día.</p>
          ) : (
            <div style={styles.dailyOrdersList}>
              {orders.map((order) => (
                <article key={order.id} style={styles.dailyOrderItem}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.customerName}</span>
                  </div>

                  <div>
                    <span style={getStatusStyle(order.status)}>
                      {formatStatus(order.status)}
                    </span>
                  </div>

                  <div style={styles.productNumbers}>
                    <strong>{formatCurrency(order.total)}</strong>
                    <span>{formatPaymentMethod(order.paymentMethod)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={styles.dailyActions}>
          <button style={styles.exportButton} onClick={exportDailyCloseExcel}>
  Exportar cierre Excel
</button>

          <button style={styles.secondaryButton} onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
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
  dailyCloseButton: {
    background: COLORS.warning,
    color: COLORS.primary,
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
  dailyCloseModal: {
    width: "min(980px, 100%)",
    maxHeight: "88vh",
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
  },
  dailyCloseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "18px"
  },
  dailyMetric: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "16px",
    display: "grid",
    gap: "6px"
  },
  dailySection: {
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: "18px",
    marginTop: "18px"
  },
  dailyTitle: {
    margin: "0 0 12px",
    color: COLORS.primary,
    fontSize: "22px"
  },
  statusSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px"
  },
  statusSummaryItem: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontWeight: "900"
  },
  paymentSummary: {
    display: "grid",
    gap: "10px"
  },
  paymentRow: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "900"
  },
  productsTable: {
    display: "grid",
    gap: "10px"
  },
  productRow: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center"
  },
  productNumbers: {
    display: "grid",
    gap: "4px",
    textAlign: "right",
    color: COLORS.primary
  },
  dailyOrdersList: {
    display: "grid",
    gap: "10px"
  },
  dailyOrderItem: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: "14px",
    alignItems: "center"
  },
  dailyActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap"
  }
};

export default OrderManagement;
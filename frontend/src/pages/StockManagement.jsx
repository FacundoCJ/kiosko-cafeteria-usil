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

const STOCK_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "normal", label: "Stock normal" },
  { value: "bajo", label: "Stock bajo" },
  { value: "agotado", label: "Agotados" }
];

const formatCurrency = (value) => {
  return `S/ ${Number(value || 0).toFixed(2)}`;
};

const normalizeText = (value) => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const getStockLevel = (stock) => {
  const value = Number(stock || 0);

  if (value <= 0) {
    return {
      key: "agotado",
      label: "Agotado",
      color: COLORS.danger,
      background: COLORS.dangerLight
    };
  }

  if (value <= 5) {
    return {
      key: "bajo",
      label: "Stock bajo",
      color: COLORS.warning,
      background: COLORS.warningLight
    };
  }

  return {
    key: "normal",
    label: "Normal",
    color: COLORS.success,
    background: COLORS.successLight
  };
};

const getStockBadgeStyle = (stock) => {
  const level = getStockLevel(stock);

  return {
    ...styles.stockBadge,
    color: level.color,
    background: level.background,
    borderColor: level.color
  };
};

function StockManagement() {
  const currentUser = getCurrentUser();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["Todas"]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedStockFilter, setSelectedStockFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar productos");
      }

      const loadedProducts = data.products || [];

      setProducts(loadedProducts);

      const uniqueCategories = Array.from(
        new Set(loadedProducts.map((product) => product.category))
      ).filter(Boolean);

      setCategories(["Todas", ...uniqueCategories]);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return products.filter((product) => {
      const matchesSearch =
        normalizeText(product.name).includes(normalizedSearch) ||
        normalizeText(product.description).includes(normalizedSearch) ||
        normalizeText(product.category).includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "Todas" || product.category === selectedCategory;

      const stockLevel = getStockLevel(product.stock).key;

      const matchesStock =
        selectedStockFilter === "todos" || selectedStockFilter === stockLevel;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, selectedStockFilter]);

  const summary = useMemo(() => {
    return {
      totalProducts: products.length,
      normalStock: products.filter(
        (product) => getStockLevel(product.stock).key === "normal"
      ).length,
      lowStock: products.filter(
        (product) => getStockLevel(product.stock).key === "bajo"
      ).length,
      outOfStock: products.filter(
        (product) => getStockLevel(product.stock).key === "agotado"
      ).length,
      totalUnits: products.reduce(
        (sum, product) => sum + Number(product.stock || 0),
        0
      )
    };
  }, [products]);

  const updateStock = async (product, newStock) => {
    const safeStock = Math.max(0, Number(newStock || 0));

    try {
      setUpdatingProductId(product.id);
      setMessage("");

      const response = await fetch(`${API_URL}/products/${product.id}/stock`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          stock: safeStock
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el stock");
      }

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id
            ? {
                ...item,
                stock: safeStock
              }
            : item
        )
      );

      setMessage(
        `Stock actualizado: ${product.name} ahora tiene ${safeStock} unidades.`
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al actualizar stock.");
    } finally {
      setUpdatingProductId(null);
    }
  };

  const adjustStock = (product, amount) => {
    const currentStock = Number(product.stock || 0);
    const newStock = currentStock + amount;

    updateStock(product, newStock);
  };

  const manualStockUpdate = (product) => {
    const value = window.prompt(
      `Nuevo stock para ${product.name}:`,
      String(product.stock || 0)
    );

    if (value === null) {
      return;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      setMessage("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }

    updateStock(product, parsedValue);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Todas");
    setSelectedStockFilter("todos");
  };

  const exportStockCsv = () => {
    if (filteredProducts.length === 0) {
      setMessage("No hay productos para exportar.");
      return;
    }

    const headers = [
      "Producto",
      "Categoría",
      "Precio",
      "Stock",
      "Estado de stock",
      "Activo"
    ];

    const rows = filteredProducts.map((product) => [
      product.name,
      product.category,
      Number(product.price || 0).toFixed(2),
      product.stock,
      getStockLevel(product.stock).label,
      product.isActive ? "Sí" : "No"
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "reporte-stock-productos.csv";
    link.click();

    URL.revokeObjectURL(url);
    setMessage("Reporte de stock exportado correctamente.");
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brandBlock}>
          <img src={logoUsil} alt="USIL" style={styles.logoImage} />

          <div>
            <h1 style={styles.title}>Control de stock</h1>

            <p style={styles.subtitle}>
              Reposición rápida de productos, control de stock bajo y ajuste
              operativo para Cafetería USIL.
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <a href="/admin/pedidos" style={styles.linkButton}>
            Pedidos
          </a>

          <a href="/admin/productos" style={styles.linkButton}>
            Productos
          </a>

          <a href="/admin/reportes" style={styles.linkButton}>
            Reportes
          </a>

          {currentUser?.role === "ADMIN" && (
            <a href="/admin/usuarios" style={styles.linkButton}>
              Usuarios
            </a>
          )}

          <button style={styles.refreshButton} onClick={loadProducts}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.metrics}>
        <article style={styles.metricCard}>
          <span>Total productos</span>
          <strong>{summary.totalProducts}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Stock normal</span>
          <strong>{summary.normalStock}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Stock bajo</span>
          <strong>{summary.lowStock}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Agotados</span>
          <strong>{summary.outOfStock}</strong>
        </article>

        <article style={styles.metricCard}>
          <span>Unidades totales</span>
          <strong>{summary.totalUnits}</strong>
        </article>
      </section>

      <section style={styles.filtersCard}>
        <label style={styles.label}>
          Buscar producto
          <input
            type="text"
            placeholder="Ej. café, brownie, bebida..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Categoría
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            style={styles.input}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Estado de stock
          <select
            value={selectedStockFilter}
            onChange={(event) => setSelectedStockFilter(event.target.value)}
            style={styles.input}
          >
            {STOCK_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>

        <div style={styles.filterActions}>
          <button style={styles.secondaryButton} onClick={resetFilters}>
            Limpiar
          </button>

          <button style={styles.exportButton} onClick={exportStockCsv}>
            Exportar stock CSV
          </button>
        </div>
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.productGrid}>
        {filteredProducts.length === 0 ? (
          <p style={styles.emptyState}>No se encontraron productos.</p>
        ) : (
          filteredProducts.map((product) => (
            <article key={product.id} style={styles.productCard}>
              <div style={styles.productTop}>
                <div>
                  <h2 style={styles.productName}>{product.name}</h2>
                  <p style={styles.productCategory}>{product.category}</p>
                </div>

                <span style={getStockBadgeStyle(product.stock)}>
                  {getStockLevel(product.stock).label}
                </span>
              </div>

              <p style={styles.productDescription}>{product.description}</p>

              <div style={styles.productInfo}>
                <div>
                  <span>Precio</span>
                  <strong>{formatCurrency(product.price)}</strong>
                </div>

                <div>
                  <span>Stock actual</span>
                  <strong>{product.stock}</strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>{product.isActive ? "Activo" : "Inactivo"}</strong>
                </div>
              </div>

              <div style={styles.stockActions}>
                <button
                  style={styles.minusButton}
                  disabled={updatingProductId === product.id}
                  onClick={() => adjustStock(product, -5)}
                >
                  -5
                </button>

                <button
                  style={styles.minusButton}
                  disabled={updatingProductId === product.id}
                  onClick={() => adjustStock(product, -1)}
                >
                  -1
                </button>

                <button
                  style={styles.manualButton}
                  disabled={updatingProductId === product.id}
                  onClick={() => manualStockUpdate(product)}
                >
                  Ajustar
                </button>

                <button
                  style={styles.plusButton}
                  disabled={updatingProductId === product.id}
                  onClick={() => adjustStock(product, 1)}
                >
                  +1
                </button>

                <button
                  style={styles.plusButton}
                  disabled={updatingProductId === product.id}
                  onClick={() => adjustStock(product, 5)}
                >
                  +5
                </button>

                <button
                  style={styles.plusButton}
                  disabled={updatingProductId === product.id}
                  onClick={() => adjustStock(product, 10)}
                >
                  +10
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
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
    maxWidth: "640px"
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
  label: {
    display: "grid",
    gap: "8px",
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: "14px"
  },
  input: {
    minWidth: "230px",
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
  message: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px 18px",
    fontWeight: "800",
    marginBottom: "18px"
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "18px"
  },
  productCard: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    display: "grid",
    gap: "14px"
  },
  productTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "start"
  },
  productName: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "24px"
  },
  productCategory: {
    margin: "6px 0 0",
    color: COLORS.textSoft,
    fontWeight: "800"
  },
  stockBadge: {
    border: "1px solid",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },
  productDescription: {
    color: COLORS.textSoft,
    margin: 0,
    minHeight: "42px"
  },
  productInfo: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px"
  },
  stockActions: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "8px"
  },
  plusButton: {
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "12px",
    padding: "11px",
    fontWeight: "900",
    cursor: "pointer"
  },
  minusButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "12px",
    padding: "11px",
    fontWeight: "900",
    cursor: "pointer"
  },
  manualButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "12px",
    padding: "11px",
    fontWeight: "900",
    cursor: "pointer"
  },
  emptyState: {
    gridColumn: "1 / -1",
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "22px",
    padding: "32px",
    textAlign: "center",
    color: COLORS.textSoft,
    fontWeight: "800"
  }
};

export default StockManagement;
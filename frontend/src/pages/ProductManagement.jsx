import React, { useEffect, useMemo, useRef, useState } from "react";
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
  danger: "#D72638"
};

const emptyForm = {
  name: "",
  description: "",
  categoryName: "",
  price: "",
  stock: "",
  image: "food"
};

export default function ProductManagement() {
  const formRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductName, setEditingProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products?includeInactive=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los productos");
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      setMessage("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/products/admin/categories`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar las categorías");
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.error(error);
      setMessage("No se pudieron cargar las categorías.");
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const categoryOptions = useMemo(() => {
    const productCategories = products.map((product) => product.category);
    const categoryNames = categories.map((category) => category.name);
    return ["Todas", ...new Set([...categoryNames, ...productCategories])];
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Todas") return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const activeProducts = useMemo(() => {
    return products.filter((product) => product.isActive).length;
  }, [products]);

  const inactiveProducts = useMemo(() => {
    return products.filter((product) => !product.isActive).length;
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => product.stock <= 5).length;
  }, [products]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProductId(null);
    setEditingProductName("");
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setEditingProductName(product.name);

    setForm({
      name: product.name,
      description: product.description,
      categoryName: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || "food"
    });

    setMessage(`Editando producto: ${product.name}`);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        name: form.name,
        description: form.description,
        categoryName: form.categoryName,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image || "food"
      };

      const url = editingProductId
        ? `${API_URL}/products/${editingProductId}`
        : `${API_URL}/products`;

      const method = editingProductId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el producto");
      }

      setMessage(
        editingProductId
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente."
      );

      resetForm();
      await loadProducts();
      await loadCategories();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al guardar producto.");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId) => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products/${productId}/toggle-status`, {
        method: "PATCH",
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cambiar el estado del producto");
      }

      setMessage(data.message);
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cambiar estado del producto.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId, productName) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar "${productName}" del catálogo? No aparecerá en el kiosko, pero quedará guardado en la base de datos.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo eliminar el producto");
      }

      setMessage(data.message);
      resetForm();
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al eliminar producto.");
    } finally {
      setLoading(false);
    }
  };

  const updateStockQuickly = async (product, newStock) => {
    if (newStock < 0) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products/${product.id}/stock`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          stock: newStock
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el stock");
      }

      setMessage(`Stock de ${product.name} actualizado.`);
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al actualizar stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>USIL</div>
          <h1 style={styles.title}>Gestión de productos</h1>
          <p style={styles.subtitle}>
            Administra el catálogo, precios, stock y disponibilidad del kiosko.
          </p>
        </div>

        <div style={styles.headerActions}>
  <a href="/admin" style={styles.secondaryButton}>
    Panel pedidos
  </a>

  <a href="/admin/usuarios" style={styles.secondaryButton}>
    Usuarios
  </a>

  <a href="/admin/reportes" style={styles.secondaryButton}>
    Reportes
  </a>

  <a href="/" style={styles.secondaryButton}>
    Ir al kiosko
  </a>

  <button style={styles.primaryButton} onClick={loadProducts}>
    {loading ? "Cargando..." : "Actualizar"}
  </button>

  <button style={styles.logoutButton} onClick={logout}>
    Cerrar sesión
  </button>
</div>
      </header>

      <section style={styles.metrics}>
        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Total productos</span>
          <strong style={styles.metricValue}>{products.length}</strong>
        </article>

        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Activos</span>
          <strong style={styles.metricValue}>{activeProducts}</strong>
        </article>

        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Inactivos</span>
          <strong style={styles.metricValue}>{inactiveProducts}</strong>
        </article>

        <article style={styles.metricCard}>
          <span style={styles.metricLabel}>Stock bajo</span>
          <strong style={styles.metricValue}>{lowStockProducts}</strong>
        </article>
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.layout}>
        <form
          ref={formRef}
          style={{
            ...styles.formCard,
            border: editingProductId
              ? `2px solid ${COLORS.secondary}`
              : `1px solid ${COLORS.border}`
          }}
          onSubmit={handleSubmit}
        >
          <h2 style={styles.sectionTitle}>
            {editingProductId ? "Editando producto" : "Nuevo producto"}
          </h2>

          {editingProductId && (
            <div style={styles.editingBox}>
              Producto seleccionado: <strong>{editingProductName}</strong>
            </div>
          )}

          <label style={styles.label}>
            Nombre
            <input
              style={styles.input}
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ejemplo: Café americano"
              required
            />
          </label>

          <label style={styles.label}>
            Descripción
            <textarea
              style={styles.textarea}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe el producto"
              required
            />
          </label>

          <label style={styles.label}>
            Categoría
            <input
              style={styles.input}
              type="text"
              name="categoryName"
              value={form.categoryName}
              onChange={handleChange}
              placeholder="Ejemplo: Bebidas calientes"
              list="categories-list"
              required
            />
            <datalist id="categories-list">
              {categories.map((category) => (
                <option key={category.id} value={category.name} />
              ))}
            </datalist>
          </label>

          <div style={styles.formRow}>
            <label style={styles.label}>
              Precio
              <input
                style={styles.input}
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                placeholder="0.00"
                required
              />
            </label>

            <label style={styles.label}>
              Stock
              <input
                style={styles.input}
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="0"
                required
              />
            </label>
          </div>

          <label style={styles.label}>
            Ícono / imagen
            <select
              style={styles.input}
              name="image"
              value={form.image}
              onChange={handleChange}
            >
              <option value="food">Comida general</option>
              <option value="coffee">Café</option>
              <option value="cappuccino">Capuccino</option>
              <option value="juice">Jugo</option>
              <option value="sandwich">Sándwich</option>
              <option value="empanada">Empanada</option>
              <option value="menu">Menú</option>
              <option value="brownie">Brownie</option>
              <option value="water">Agua</option>
            </select>
          </label>

          <div style={styles.formActions}>
            <button style={styles.saveButton} type="submit" disabled={loading}>
              {editingProductId ? "Guardar cambios" : "Crear producto"}
            </button>

            {editingProductId && (
              <>
                <button
                  style={styles.deleteButton}
                  type="button"
                  onClick={() =>
                    deleteProduct(editingProductId, editingProductName)
                  }
                >
                  Eliminar del catálogo
                </button>

                <button
                  style={styles.cancelButton}
                  type="button"
                  onClick={resetForm}
                >
                  Cancelar edición
                </button>
              </>
            )}
          </div>
        </form>

        <section style={styles.productsCard}>
          <div style={styles.productsHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Catálogo</h2>
              <p style={styles.sectionSubtitle}>
                Productos disponibles e inactivos del sistema.
              </p>
            </div>

            <select
              style={styles.filterSelect}
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.productList}>
            {filteredProducts.length === 0 ? (
              <div style={styles.emptyBox}>
                No hay productos en esta categoría.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <article
                  key={product.id}
                  style={{
                    ...styles.productItem,
                    opacity: product.isActive ? 1 : 0.55
                  }}
                >
                  <div style={styles.productIcon}>
                    {getProductEmoji(product.image)}
                  </div>

                  <div style={styles.productMain}>
                    <div style={styles.productTop}>
                      <div>
                        <h3 style={styles.productName}>{product.name}</h3>
                        <p style={styles.productDescription}>
                          {product.description}
                        </p>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          background: product.isActive
                            ? COLORS.success
                            : COLORS.danger
                        }}
                      >
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div style={styles.productMeta}>
                      <span>{product.category}</span>
                      <strong>S/ {product.price.toFixed(2)}</strong>
                      <span
                        style={{
                          ...styles.stockPill,
                          background:
                            product.stock <= 5
                              ? "#FFF3CD"
                              : COLORS.primaryLight,
                          color:
                            product.stock <= 5
                              ? "#9A6700"
                              : COLORS.primary
                        }}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>

                    <div style={styles.productActions}>
                      <button
                        style={styles.smallButton}
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.smallButton}
                        onClick={() =>
                          updateStockQuickly(product, product.stock + 1)
                        }
                      >
                        + Stock
                      </button>

                      <button
                        style={styles.smallButton}
                        onClick={() =>
                          updateStockQuickly(product, product.stock - 1)
                        }
                      >
                        - Stock
                      </button>

                      <button
                        style={{
                          ...styles.toggleButton,
                          background: product.isActive
                            ? COLORS.danger
                            : COLORS.success
                        }}
                        onClick={() => toggleProductStatus(product.id)}
                      >
                        {product.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
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
    water: "💧",
    food: "🍴"
  };

  return emojis[image] || "🍴";
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
  message: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px 18px",
    fontWeight: "800",
    marginBottom: "20px"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: "22px",
    alignItems: "start"
  },
  formCard: {
    background: COLORS.white,
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    display: "grid",
    gap: "16px"
  },
  editingBox: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "12px 14px",
    fontSize: "15px"
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
  label: {
    display: "grid",
    gap: "8px",
    color: COLORS.text,
    fontSize: "15px",
    fontWeight: "800"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "13px 14px",
    fontSize: "16px",
    color: COLORS.text,
    background: COLORS.white,
    outline: "none"
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "13px 14px",
    fontSize: "16px",
    color: COLORS.text,
    background: COLORS.white,
    outline: "none",
    resize: "vertical",
    fontFamily: "Arial, sans-serif"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },
  formActions: {
    display: "grid",
    gap: "12px"
  },
  saveButton: {
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer"
  },
  deleteButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    fontSize: "17px",
    fontWeight: "900",
    cursor: "pointer"
  },
  cancelButton: {
    background: COLORS.white,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer"
  },
  productsCard: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  productsHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    marginBottom: "20px"
  },
  filterSelect: {
    minWidth: "220px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "13px 16px",
    color: COLORS.primary,
    fontSize: "15px",
    fontWeight: "800",
    background: COLORS.white
  },
  productList: {
    display: "grid",
    gap: "14px"
  },
  emptyBox: {
    background: COLORS.background,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: "18px",
    padding: "28px",
    color: COLORS.textSoft,
    textAlign: "center"
  },
  productItem: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    gap: "16px"
  },
  productIcon: {
    width: "76px",
    height: "76px",
    borderRadius: "18px",
    background: COLORS.primaryLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
    flexShrink: 0
  },
  productMain: {
    flex: 1,
    display: "grid",
    gap: "12px"
  },
  productTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px"
  },
  productName: {
    margin: "0 0 6px",
    color: COLORS.text,
    fontSize: "22px"
  },
  productDescription: {
    margin: 0,
    color: COLORS.textSoft,
    fontSize: "15px",
    lineHeight: 1.4
  },
  statusBadge: {
    color: COLORS.white,
    borderRadius: "999px",
    padding: "7px 12px",
    fontWeight: "900",
    fontSize: "13px",
    height: "fit-content"
  },
  productMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    color: COLORS.primary,
    fontSize: "15px"
  },
  stockPill: {
    borderRadius: "999px",
    padding: "7px 12px",
    fontWeight: "900"
  },
  productActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },
  smallButton: {
    border: `1px solid ${COLORS.border}`,
    background: COLORS.white,
    color: COLORS.primary,
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "800",
    cursor: "pointer"
  },
  toggleButton: {
    border: "none",
    color: COLORS.white,
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "900",
    cursor: "pointer"
  }
};
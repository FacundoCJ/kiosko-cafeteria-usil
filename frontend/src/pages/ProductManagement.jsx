import React, { useEffect, useMemo, useState } from "react";
import logoUsilCuadradoImg from "../assets/branding/logo-usil-cuadrado.png";

import cafeAmericanoImg from "../assets/productos/cafe-americano.png";
import capuccinoImg from "../assets/productos/capuccino.png";
import jugoNaranjaImg from "../assets/productos/jugo-naranja.png";
import panPolloImg from "../assets/productos/pan-pollo.png";
import empanadaCarneImg from "../assets/productos/empanada-carne.png";
import menuEjecutivoImg from "../assets/productos/menu-ejecutivo.png";
import brownieImg from "../assets/productos/brownie.png";
import aguaMineralImg from "../assets/productos/agua-mineral.png";
import triplePolloImg from "../assets/productos/triple-pollo.png";

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
  danger: "#D72638",
  warning: "#F4B400"
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

const IMAGE_OPTIONS = [
  { value: "coffee", label: "Café americano", image: cafeAmericanoImg },
  { value: "cappuccino", label: "Capuccino", image: capuccinoImg },
  { value: "juice", label: "Jugo de naranja", image: jugoNaranjaImg },
  { value: "water", label: "Agua mineral", image: aguaMineralImg },
  { value: "sandwich", label: "Pan con pollo", image: panPolloImg },
  { value: "food", label: "Triple de pollo", image: triplePolloImg },
  { value: "empanada", label: "Empanada de carne", image: empanadaCarneImg },
  { value: "menu", label: "Menú ejecutivo", image: menuEjecutivoImg },
  { value: "brownie", label: "Brownie", image: brownieImg }
];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  image: "coffee",
  categoryId: ""
};

export default function ProductManagement() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedImageOption = IMAGE_OPTIONS.find(
    (option) => option.value === form.image
  );

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
      setMessage(error.message || "No se pudieron cargar los productos.");
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
      setMessage(error.message || "No se pudieron cargar las categorías.");
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (!form.categoryId && categories.length > 0 && !editingProductId) {
      setForm((currentForm) => ({
        ...currentForm,
        categoryId: String(categories[0].id)
      }));
    }
  }, [categories, form.categoryId, editingProductId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "TODAS" ||
        getCategoryName(product) === selectedCategory;

      const matchesStatus =
        selectedStatus === "TODOS" ||
        (selectedStatus === "ACTIVOS" && product.isActive) ||
        (selectedStatus === "INACTIVOS" && !product.isActive);

      return matchesCategory && matchesStatus;
    });
  }, [products, selectedCategory, selectedStatus]);

  const categoryNames = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => getCategoryName(product))
          .filter((category) => Boolean(category))
      )
    ];
  }, [products]);

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((product) => product.isActive).length;
    const inactiveProducts = products.filter((product) => !product.isActive).length;
    const lowStockProducts = products.filter(
      (product) => Number(product.stock) > 0 && Number(product.stock) <= 5
    ).length;
    const withoutStockProducts = products.filter(
      (product) => Number(product.stock) <= 0
    ).length;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      withoutStockProducts
    };
  }, [products]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ? String(categories[0].id) : ""
    });
    setEditingProductId(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setMessage("Ingresa el nombre del producto.");
      return false;
    }

    if (!form.description.trim()) {
      setMessage("Ingresa la descripción del producto.");
      return false;
    }

    if (!form.price || Number(form.price) <= 0) {
      setMessage("Ingresa un precio válido.");
      return false;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      setMessage("Ingresa un stock válido.");
      return false;
    }

    if (!form.categoryId) {
      setMessage("Selecciona una categoría.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image,
        categoryId: Number(form.categoryId)
      };

      const isEditing = Boolean(editingProductId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/products/${editingProductId}`
          : `${API_URL}/products`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el producto");
      }

      setMessage(
        isEditing
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente."
      );

      resetForm();
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al guardar producto.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product) => {
    const categoryId =
      product.categoryId || findCategoryIdByName(getCategoryName(product));

    setEditingProductId(product.id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price || ""),
      stock: String(product.stock ?? ""),
      image: product.image || "food",
      categoryId: categoryId ? String(categoryId) : ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const updateStock = async (product) => {
    const newStock = window.prompt(
      `Nuevo stock para ${product.name}:`,
      String(product.stock)
    );

    if (newStock === null) return;

    if (newStock.trim() === "" || Number(newStock) < 0) {
      setMessage("Ingresa un stock válido.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products/${product.id}/stock`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          stock: Number(newStock)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el stock");
      }

      setMessage(`Stock actualizado para ${product.name}.`);
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al actualizar stock.");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (product) => {
    const action = product.isActive ? "desactivar" : "activar";

    const confirmed = window.confirm(
      `¿Deseas ${action} el producto "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/products/${product.id}/toggle-status`,
        {
          method: "PATCH",
          headers: getAuthHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cambiar el estado");
      }

      setMessage(`Producto ${action === "activar" ? "activado" : "desactivado"}.`);
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cambiar estado.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar definitivamente "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo eliminar el producto");
      }

      setMessage("Producto eliminado correctamente.");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al eliminar producto.");
    } finally {
      setLoading(false);
    }
  };

  const findCategoryIdByName = (categoryName) => {
    const category = categories.find((item) => item.name === categoryName);
    return category?.id || "";
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <div style={styles.logoBox}>
            <img src={logoUsilCuadradoImg} alt="USIL" style={styles.logoImage} />
          </div>

          <div>
            <h1 style={styles.title}>Gestión de productos</h1>
            <p style={styles.subtitle}>
              Administra catálogo, precios, stock y disponibilidad del kiosko.
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <a href="/admin/pedidos" style={styles.linkButton}>
            Panel pedidos
          </a>

          <a href="/admin/reportes" style={styles.linkButton}>
            Reportes
          </a>

          {isAdmin && (
            <a href="/admin/usuarios" style={styles.linkButton}>
              Usuarios
            </a>
          )}

          <a href="/" style={styles.linkButton}>
            Kiosko
          </a>

          <button style={styles.refreshButton} onClick={loadProducts}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.metrics}>
        <MetricCard label="Total productos" value={metrics.totalProducts} />
        <MetricCard label="Activos" value={metrics.activeProducts} />
        <MetricCard label="Inactivos" value={metrics.inactiveProducts} />
        <MetricCard label="Stock bajo" value={metrics.lowStockProducts} />
        <MetricCard label="Sin stock" value={metrics.withoutStockProducts} />
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.layout}>
        <section style={styles.formCard}>
          <h2 style={styles.sectionTitle}>
            {editingProductId ? "Editar producto" : "Nuevo producto"}
          </h2>

          <form style={styles.form} onSubmit={handleSubmit}>
            <label style={styles.label}>
              Nombre
              <input
                style={styles.input}
                name="name"
                value={form.name}
                placeholder="Ejemplo: Café americano"
                onChange={handleChange}
              />
            </label>

            <label style={styles.label}>
              Descripción
              <textarea
                style={styles.textarea}
                name="description"
                value={form.description}
                placeholder="Descripción breve del producto"
                onChange={handleChange}
              />
            </label>

            <div style={styles.doubleField}>
              <label style={styles.label}>
                Precio
                <input
                  style={styles.input}
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  placeholder="0.00"
                  onChange={handleChange}
                />
              </label>

              <label style={styles.label}>
                Stock
                <input
                  style={styles.input}
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  placeholder="0"
                  onChange={handleChange}
                />
              </label>
            </div>

            <label style={styles.label}>
              Categoría
              <select
                style={styles.input}
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
              >
                <option value="">Selecciona categoría</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Imagen asignada
              <select
                style={styles.input}
                name="image"
                value={form.image}
                onChange={handleChange}
              >
                {IMAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedImageOption && (
              <div style={styles.imagePreviewBox}>
                <span style={styles.imagePreviewLabel}>Vista previa</span>

                <div style={styles.imagePreviewCard}>
                  <img
                    src={selectedImageOption.image}
                    alt={selectedImageOption.label}
                    style={styles.imagePreview}
                  />

                  <strong>{selectedImageOption.label}</strong>
                </div>
              </div>
            )}

            <div style={styles.formActions}>
              <button
                style={styles.saveButton}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Guardando..."
                  : editingProductId
                    ? "Actualizar producto"
                    : "Crear producto"}
              </button>

              {editingProductId && (
                <button
                  style={styles.cancelButton}
                  type="button"
                  onClick={resetForm}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.productsCard}>
          <div style={styles.productsHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Catálogo registrado</h2>
              <p style={styles.smallText}>
                Mostrando {filteredProducts.length} de {products.length} productos.
              </p>
            </div>

            <div style={styles.filters}>
              <select
                style={styles.filterInput}
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="TODAS">Todas las categorías</option>

                {categoryNames.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                style={styles.filterInput}
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div style={styles.emptyBox}>No hay productos para mostrar.</div>
          ) : (
            <div style={styles.productList}>
              {filteredProducts.map((product) => (
                <article key={product.id} style={styles.productRow}>
                  <div style={styles.productMain}>
                    <div style={styles.productImageBox}>
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          style={styles.productImage}
                        />
                      ) : (
                        <span style={styles.productFallbackIcon}>🍴</span>
                      )}
                    </div>

                    <div>
                      <div style={styles.productTitleLine}>
                        <h3 style={styles.productName}>{product.name}</h3>

                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(product.isActive
                              ? styles.activeBadge
                              : styles.inactiveBadge)
                          }}
                        >
                          {product.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <p style={styles.productDescription}>
                        {product.description}
                      </p>

                      <div style={styles.productMeta}>
                        <span>{getCategoryName(product)}</span>
                        <span>S/ {formatCurrency(product.price)}</span>
                        <span>Stock: {product.stock}</span>
                        <span>Imagen: {product.image || "Sin imagen"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.productActions}>
                    <button
                      style={styles.editButton}
                      onClick={() => startEdit(product)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.stockButton}
                      onClick={() => updateStock(product)}
                    >
                      Stock
                    </button>

                    <button
                      style={
                        product.isActive
                          ? styles.deactivateButton
                          : styles.activateButton
                      }
                      onClick={() => toggleProductStatus(product)}
                    >
                      {product.isActive ? "Desactivar" : "Activar"}
                    </button>

                    {isAdmin && (
                      <button
                        style={styles.deleteButton}
                        onClick={() => deleteProduct(product)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <article style={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function getCategoryName(product) {
  if (!product) return "Sin categoría";

  if (typeof product.category === "string") {
    return product.category;
  }

  if (product.category?.name) {
    return product.category.name;
  }

  return "Sin categoría";
}

function getProductImage(product) {
  if (!product) return null;

  const imageKey = normalizeText(product.image || "");

  if (imageKey && PRODUCT_IMAGES[imageKey]) {
    return PRODUCT_IMAGES[imageKey];
  }

  const name = normalizeText(product.name || "");

  if (name.includes("cafe")) return cafeAmericanoImg;
  if (name.includes("capuccino") || name.includes("cappuccino")) return capuccinoImg;
  if (name.includes("jugo")) return jugoNaranjaImg;
  if (name.includes("agua")) return aguaMineralImg;
  if (name.includes("pan con pollo")) return panPolloImg;
  if (name.includes("triple")) return triplePolloImg;
  if (name.includes("empanada")) return empanadaCarneImg;
  if (name.includes("menu")) return menuEjecutivoImg;
  if (name.includes("brownie")) return brownieImg;

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
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "22px"
  },
  metricCard: {
    background: COLORS.white,
    borderRadius: "22px",
    border: `1px solid ${COLORS.border}`,
    padding: "20px",
    display: "grid",
    gap: "8px",
    color: COLORS.primary,
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    boxSizing: "border-box"
  },
  message: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px 18px",
    fontWeight: "800",
    marginBottom: "20px",
    boxSizing: "border-box"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "420px minmax(0, 1fr)",
    gap: "24px",
    alignItems: "start",
    width: "100%",
    boxSizing: "border-box"
  },
  formCard: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    position: "sticky",
    top: "24px",
    width: "100%",
    maxWidth: "420px",
    overflow: "hidden",
    boxSizing: "border-box"
  },
  productsCard: {
    background: COLORS.white,
    borderRadius: "28px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    boxShadow: "0 12px 32px rgba(11, 46, 107, 0.08)",
    minWidth: 0,
    boxSizing: "border-box"
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
  form: {
    display: "grid",
    gap: "15px",
    marginTop: "18px",
    width: "100%",
    boxSizing: "border-box"
  },
  label: {
    display: "grid",
    gap: "8px",
    color: COLORS.text,
    fontWeight: "900",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box"
  },
  input: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "13px 14px",
    fontSize: "15px",
    outline: "none",
    color: COLORS.text,
    background: COLORS.white,
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "13px 14px",
    fontSize: "15px",
    outline: "none",
    color: COLORS.text,
    background: COLORS.white,
    minHeight: "96px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box"
  },
  doubleField: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box"
  },
  imagePreviewBox: {
    display: "grid",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box"
  },
  imagePreviewLabel: {
    color: COLORS.text,
    fontWeight: "900"
  },
  imagePreviewCard: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: COLORS.primary,
    width: "100%",
    boxSizing: "border-box"
  },
  imagePreview: {
    width: "86px",
    height: "64px",
    borderRadius: "14px",
    objectFit: "contain",
    background: COLORS.white,
    flexShrink: 0
  },
  formActions: {
    display: "grid",
    gap: "10px",
    width: "100%",
    boxSizing: "border-box"
  },
  saveButton: {
    width: "100%",
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "15px 22px",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  cancelButton: {
    width: "100%",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "14px 22px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  productsHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  filterInput: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "12px 16px",
    fontSize: "15px",
    fontWeight: "800",
    color: COLORS.primary,
    background: COLORS.white,
    boxSizing: "border-box"
  },
  emptyBox: {
    background: COLORS.background,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: "22px",
    padding: "30px",
    textAlign: "center",
    color: COLORS.textSoft,
    fontWeight: "800",
    boxSizing: "border-box"
  },
  productList: {
    display: "grid",
    gap: "14px"
  },
  productRow: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "22px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "16px",
    alignItems: "center",
    boxSizing: "border-box"
  },
  productMain: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    minWidth: 0
  },
  productImageBox: {
    width: "112px",
    height: "82px",
    borderRadius: "18px",
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block"
  },
  productFallbackIcon: {
    fontSize: "32px"
  },
  productTitleLine: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  productName: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "21px"
  },
  productDescription: {
    margin: "6px 0 10px",
    color: COLORS.textSoft,
    lineHeight: 1.4
  },
  productMeta: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    color: COLORS.textSoft,
    fontSize: "13px",
    fontWeight: "800"
  },
  statusBadge: {
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "900"
  },
  activeBadge: {
    background: "#E9F8EF",
    color: COLORS.success
  },
  inactiveBadge: {
    background: "#FFE9EC",
    color: COLORS.danger
  },
  productActions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(100px, 1fr))",
    gap: "9px"
  },
  editButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    fontWeight: "900",
    cursor: "pointer"
  },
  stockButton: {
    background: COLORS.warning,
    color: COLORS.text,
    border: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    fontWeight: "900",
    cursor: "pointer"
  },
  activateButton: {
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    fontWeight: "900",
    cursor: "pointer"
  },
  deactivateButton: {
    background: "#FFE9EC",
    color: COLORS.danger,
    border: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    fontWeight: "900",
    cursor: "pointer"
  },
  deleteButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    fontWeight: "900",
    cursor: "pointer"
  }
};
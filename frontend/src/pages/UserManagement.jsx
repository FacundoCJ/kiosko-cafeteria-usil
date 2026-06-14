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

const ROLE_OPTIONS = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Acceso completo al sistema"
  },
  {
    value: "CAFETERIA",
    label: "Cafetería",
    description: "Gestiona pedidos, productos y reportes"
  },
  {
    value: "COCINA",
    label: "Cocina",
    description: "Gestiona preparación de pedidos"
  }
];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "CAFETERIA",
  isActive: true
};

export default function UserManagement() {
  const currentUser = getCurrentUser();

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("TODOS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(editingUserId);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/users`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los usuarios");
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        selectedRole === "TODOS" || user.role === selectedRole;

      const matchesStatus =
        selectedStatus === "TODOS" ||
        (selectedStatus === "ACTIVOS" && user.isActive) ||
        (selectedStatus === "INACTIVOS" && !user.isActive);

      const matchesSearch =
        !normalizedSearch ||
        user.name?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, selectedRole, selectedStatus, searchTerm]);

  const metrics = useMemo(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.isActive).length,
      inactiveUsers: users.filter((user) => !user.isActive).length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      cafeteria: users.filter((user) => user.role === "CAFETERIA").length,
      cocina: users.filter((user) => user.role === "COCINA").length
    };
  }, [users]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingUserId(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setMessage("Ingresa el nombre del usuario.");
      return false;
    }

    if (!form.email.trim()) {
      setMessage("Ingresa el correo del usuario.");
      return false;
    }

    if (!isEditing && !form.password.trim()) {
      setMessage("Ingresa una contraseña para el nuevo usuario.");
      return false;
    }

    if (!form.role) {
      setMessage("Selecciona un rol.");
      return false;
    }

    if (form.password && form.password.length < 6) {
      setMessage("La contraseña debe tener como mínimo 6 caracteres.");
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
        email: form.email.trim().toLowerCase(),
        role: form.role,
        isActive: form.isActive
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const response = await fetch(
        isEditing ? `${API_URL}/users/${editingUserId}` : `${API_URL}/users`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el usuario");
      }

      setMessage(
        isEditing
          ? "Usuario actualizado correctamente."
          : "Usuario creado correctamente."
      );

      resetForm();
      await loadUsers();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al guardar usuario.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "CAFETERIA",
      isActive: Boolean(user.isActive)
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const toggleUserStatus = async (user) => {
    const action = user.isActive ? "desactivar" : "activar";

    const confirmed = window.confirm(
      `¿Deseas ${action} la cuenta de "${user.name}"?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/users/${user.id}/toggle-status`, {
        method: "PATCH",
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cambiar el estado del usuario");
      }

      setMessage(
        user.isActive
          ? "Usuario desactivado correctamente."
          : "Usuario activado correctamente."
      );

      await loadUsers();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cambiar estado del usuario.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleDescription = ROLE_OPTIONS.find(
    (role) => role.value === form.role
  )?.description;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <div style={styles.logoBox}>
            <img src={logoUsilCuadradoImg} alt="USIL" style={styles.logoImage} />
          </div>

          <div>
            <h1 style={styles.title}>Gestión de usuarios</h1>
            <p style={styles.subtitle}>
              Administra accesos internos, roles y estados de cuenta del sistema.
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

          <a href="/admin/reportes" style={styles.linkButton}>
            Reportes
          </a>

          <a href="/" style={styles.linkButton}>
            Kiosko
          </a>

          <button style={styles.refreshButton} onClick={loadUsers}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.sessionCard}>
        <div>
          <strong style={styles.sessionTitle}>Sesión actual</strong>
          <span style={styles.sessionText}>
            {currentUser?.name || "Administrador"} · {currentUser?.email}
          </span>
        </div>

        <span style={styles.sessionBadge}>{formatRole(currentUser?.role)}</span>
      </section>

      <section style={styles.metrics}>
        <MetricCard label="Total usuarios" value={metrics.totalUsers} tone="primary" />
        <MetricCard label="Activos" value={metrics.activeUsers} tone="success" />
        <MetricCard label="Inactivos" value={metrics.inactiveUsers} tone="danger" />
        <MetricCard label="Admin" value={metrics.admins} tone="purple" />
        <MetricCard label="Cafetería" value={metrics.cafeteria} tone="warning" />
        <MetricCard label="Cocina" value={metrics.cocina} tone="primary" />
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.layout}>
        <section style={styles.formCard}>
          <h2 style={styles.sectionTitle}>
            {isEditing ? "Editar usuario" : "Nuevo usuario"}
          </h2>

          <p style={styles.smallText}>
            {isEditing
              ? "Actualiza datos, rol o estado de una cuenta existente."
              : "Crea una cuenta para personal autorizado."}
          </p>

          <form style={styles.form} onSubmit={handleSubmit}>
            <label style={styles.label}>
              Nombre
              <input
                style={styles.input}
                name="name"
                value={form.name}
                placeholder="Ejemplo: Personal de cocina"
                onChange={handleChange}
              />
            </label>

            <label style={styles.label}>
              Correo
              <input
                style={styles.input}
                name="email"
                type="email"
                value={form.email}
                placeholder="usuario@usil.edu.pe"
                onChange={handleChange}
              />
            </label>

            <label style={styles.label}>
              Contraseña
              <input
                style={styles.input}
                name="password"
                type="password"
                value={form.password}
                placeholder={
                  isEditing
                    ? "Dejar vacío para mantener contraseña"
                    : "Mínimo 6 caracteres"
                }
                onChange={handleChange}
              />
            </label>

            <label style={styles.label}>
              Rol
              <select
                style={styles.input}
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedRoleDescription && (
              <div style={styles.roleHelpBox}>
                <strong>{formatRole(form.role)}</strong>
                <span>{selectedRoleDescription}</span>
              </div>
            )}

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Cuenta activa
            </label>

            <div style={styles.formActions}>
              <button style={styles.saveButton} type="submit" disabled={loading}>
                {loading
                  ? "Guardando..."
                  : isEditing
                    ? "Actualizar usuario"
                    : "Crear usuario"}
              </button>

              {isEditing && (
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

        <section style={styles.usersCard}>
          <div style={styles.usersHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Usuarios registrados</h2>
              <p style={styles.smallText}>
                Mostrando {filteredUsers.length} de {users.length} usuarios.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                style={styles.searchInput}
                value={searchTerm}
                placeholder="Buscar usuario..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <select
                style={styles.filterInput}
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
              >
                <option value="TODOS">Todos los roles</option>
                <option value="ADMIN">Admin</option>
                <option value="CAFETERIA">Cafetería</option>
                <option value="COCINA">Cocina</option>
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

          {filteredUsers.length === 0 ? (
            <div style={styles.emptyBox}>No hay usuarios para mostrar.</div>
          ) : (
            <div style={styles.userList}>
              {filteredUsers.map((user) => {
                const isCurrentUser = currentUser?.id === user.id;

                return (
                  <article key={user.id} style={styles.userRow}>
                    <div style={styles.userMain}>
                      <div style={getAvatarStyle(user.role)}>
                        {getInitials(user.name)}
                      </div>

                      <div>
                        <div style={styles.userTitleLine}>
                          <h3 style={styles.userName}>{user.name}</h3>

                          {isCurrentUser && (
                            <span style={styles.currentBadge}>Tu cuenta</span>
                          )}

                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(user.isActive
                                ? styles.activeBadge
                                : styles.inactiveBadge)
                            }}
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <p style={styles.userEmail}>{user.email}</p>

                        <div style={styles.userMeta}>
                          <span>Rol: {formatRole(user.role)}</span>
                          <span>Creado: {formatDate(user.createdAt)}</span>
                          <span>Actualizado: {formatDate(user.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.userActions}>
                      <button
                        style={styles.editButton}
                        onClick={() => startEdit(user)}
                      >
                        Editar
                      </button>

                      <button
                        style={
                          user.isActive
                            ? styles.deactivateButton
                            : styles.activateButton
                        }
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
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
    danger: {
      background: COLORS.dangerLight,
      color: COLORS.danger,
      border: "#FFC7D0"
    },
    warning: {
      background: COLORS.warningLight,
      color: "#8A6200",
      border: "#F5D36B"
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

function getAvatarStyle(role) {
  const base = {
    ...styles.avatar
  };

  if (role === "ADMIN") {
    return {
      ...base,
      background: COLORS.purpleLight,
      color: COLORS.purple,
      border: "1px solid #EAC6F1"
    };
  }

  if (role === "CAFETERIA") {
    return {
      ...base,
      background: COLORS.warningLight,
      color: "#8A6200",
      border: "1px solid #F5D36B"
    };
  }

  if (role === "COCINA") {
    return {
      ...base,
      background: COLORS.successLight,
      color: COLORS.success,
      border: "1px solid #BFE8CE"
    };
  }

  return base;
}

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function formatRole(role) {
  const labels = {
    ADMIN: "Administrador",
    CAFETERIA: "Cafetería",
    COCINA: "Cocina"
  };

  return labels[role] || role || "Sin rol";
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
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
    marginBottom: "22px",
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
  sessionCard: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "18px 22px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)",
    boxSizing: "border-box"
  },
  sessionTitle: {
    display: "block",
    color: COLORS.primary,
    fontSize: "17px",
    marginBottom: "4px"
  },
  sessionText: {
    color: COLORS.textSoft
  },
  sessionBadge: {
    background: COLORS.primary,
    color: COLORS.white,
    borderRadius: "999px",
    padding: "11px 18px",
    fontWeight: "900"
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px"
  },
  metricCard: {
    borderRadius: "22px",
    padding: "18px",
    display: "grid",
    gap: "8px",
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
  usersCard: {
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
    fontSize: "14px",
    lineHeight: 1.4
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
  roleHelpBox: {
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "14px",
    color: COLORS.primary,
    display: "grid",
    gap: "5px",
    boxSizing: "border-box"
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: COLORS.text,
    fontWeight: "900",
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "13px 14px",
    boxSizing: "border-box"
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
  usersHeader: {
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
  searchInput: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "12px 16px",
    fontSize: "15px",
    fontWeight: "800",
    color: COLORS.primary,
    background: COLORS.white,
    minWidth: "220px",
    boxSizing: "border-box"
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
  userList: {
    display: "grid",
    gap: "14px"
  },
  userRow: {
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
  userMain: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    minWidth: 0
  },
  avatar: {
    width: "62px",
    height: "62px",
    borderRadius: "20px",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "900",
    flexShrink: 0
  },
  userTitleLine: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  userName: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "21px"
  },
  userEmail: {
    margin: "6px 0 10px",
    color: COLORS.textSoft,
    lineHeight: 1.4
  },
  userMeta: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    color: COLORS.textSoft,
    fontSize: "13px",
    fontWeight: "800"
  },
  currentBadge: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "900"
  },
  statusBadge: {
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "900"
  },
  activeBadge: {
    background: COLORS.successLight,
    color: COLORS.success
  },
  inactiveBadge: {
    background: COLORS.dangerLight,
    color: COLORS.danger
  },
  userActions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
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
    background: COLORS.dangerLight,
    color: COLORS.danger,
    border: "none",
    borderRadius: "14px",
    padding: "11px 14px",
    fontWeight: "900",
    cursor: "pointer"
  }
};
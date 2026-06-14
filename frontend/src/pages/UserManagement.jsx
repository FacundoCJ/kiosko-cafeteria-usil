import React, { useEffect, useMemo, useRef, useState } from "react";
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
  warning: "#F4B400"
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "CAFETERIA"
};

export default function UserManagement() {
  const formRef = useRef(null);
  const currentUser = getCurrentUser();

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [selectedRole, setSelectedRole] = useState("TODOS");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (selectedRole === "TODOS") return users;
    return users.filter((user) => user.role === selectedRole);
  }, [users, selectedRole]);

  const adminCount = useMemo(() => {
    return users.filter((user) => user.role === "ADMIN").length;
  }, [users]);

  const cafeteriaCount = useMemo(() => {
    return users.filter((user) => user.role === "CAFETERIA").length;
  }, [users]);

  const cocinaCount = useMemo(() => {
    return users.filter((user) => user.role === "COCINA").length;
  }, [users]);

  const inactiveCount = useMemo(() => {
    return users.filter((user) => !user.isActive).length;
  }, [users]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUserId(null);
    setEditingUserName("");
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setEditingUserName(user.name);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role
    });

    setMessage(`Editando usuario: ${user.name}`);

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
        email: form.email,
        role: form.role
      };

      if (!editingUserId || form.password.trim()) {
        payload.password = form.password;
      }

      const url = editingUserId
        ? `${API_URL}/users/${editingUserId}`
        : `${API_URL}/users`;

      const method = editingUserId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el usuario");
      }

      setMessage(
        editingUserId
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

  const toggleUserStatus = async (user) => {
    const action = user.isActive ? "desactivar" : "activar";

    const confirmed = window.confirm(
      `¿Deseas ${action} el usuario "${user.name}"?`
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
        throw new Error(data.message || "No se pudo cambiar el estado");
      }

      setMessage(data.message);
      await loadUsers();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cambiar estado del usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>USIL</div>
          <h1 style={styles.title}>Gestión de usuarios</h1>
          <p style={styles.subtitle}>
            Administra accesos, roles y estado de los usuarios del sistema.
          </p>
        </div>

        <div style={styles.headerActions}>
          <a href="/admin/pedidos" style={styles.secondaryButton}>
            Panel pedidos
          </a>

          <a href="/admin/productos" style={styles.secondaryButton}>
            Productos
          </a>

          <a href="/admin/reportes" style={styles.secondaryButton}>
            Reportes
          </a>

          <a href="/" style={styles.secondaryButton}>
            Ir al kiosko
          </a>

          <button style={styles.primaryButton} onClick={loadUsers}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.sessionCard}>
        <div>
          <strong>Sesión actual</strong>
          <p>
            {currentUser?.name || "Usuario"} · {currentUser?.email || "sin correo"} ·{" "}
            {currentUser?.role || "sin rol"}
          </p>
        </div>
      </section>

      <section style={styles.metrics}>
        <MetricCard label="Total usuarios" value={users.length} />
        <MetricCard label="Administradores" value={adminCount} />
        <MetricCard label="Cafetería" value={cafeteriaCount} />
        <MetricCard label="Cocina" value={cocinaCount} />
        <MetricCard label="Inactivos" value={inactiveCount} />
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.layout}>
        <form
          ref={formRef}
          style={{
            ...styles.formCard,
            border: editingUserId
              ? `2px solid ${COLORS.secondary}`
              : `1px solid ${COLORS.border}`
          }}
          onSubmit={handleSubmit}
        >
          <h2 style={styles.sectionTitle}>
            {editingUserId ? "Editando usuario" : "Nuevo usuario"}
          </h2>

          {editingUserId && (
            <div style={styles.editingBox}>
              Usuario seleccionado: <strong>{editingUserName}</strong>
            </div>
          )}

          <label style={styles.label}>
            Nombre completo
            <input
              style={styles.input}
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ejemplo: Usuario Cocina"
              required
            />
          </label>

          <label style={styles.label}>
            Correo
            <input
              style={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="usuario@usil.edu.pe"
              required
            />
          </label>

          <label style={styles.label}>
            Contraseña
            <input
              style={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={
                editingUserId
                  ? "Dejar vacío para conservar la contraseña"
                  : "Mínimo 6 caracteres"
              }
              required={!editingUserId}
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
              <option value="ADMIN">ADMIN</option>
              <option value="CAFETERIA">CAFETERIA</option>
              <option value="COCINA">COCINA</option>
            </select>
          </label>

          <div style={styles.roleInfo}>
            <strong>Permisos por rol</strong>
            <span>ADMIN: acceso completo, usuarios, productos, reportes y pedidos.</span>
            <span>CAFETERIA: pedidos, productos y reportes.</span>
            <span>COCINA: pedidos y cambios de preparación.</span>
          </div>

          <div style={styles.formActions}>
            <button style={styles.saveButton} type="submit" disabled={loading}>
              {editingUserId ? "Guardar cambios" : "Crear usuario"}
            </button>

            {editingUserId && (
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

        <section style={styles.usersCard}>
          <div style={styles.usersHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Usuarios registrados</h2>
              <p style={styles.sectionSubtitle}>
                Control de accesos administrativos del sistema.
              </p>
            </div>

            <select
              style={styles.filterSelect}
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CAFETERIA">CAFETERIA</option>
              <option value="COCINA">COCINA</option>
            </select>
          </div>

          <div style={styles.userList}>
            {filteredUsers.length === 0 ? (
              <div style={styles.emptyBox}>No hay usuarios para este filtro.</div>
            ) : (
              filteredUsers.map((user) => (
                <article
                  key={user.id}
                  style={{
                    ...styles.userItem,
                    opacity: user.isActive ? 1 : 0.55
                  }}
                >
                  <div style={styles.avatar}>
                    {getInitials(user.name)}
                  </div>

                  <div style={styles.userMain}>
                    <div style={styles.userTop}>
                      <div>
                        <h3 style={styles.userName}>{user.name}</h3>
                        <p style={styles.userEmail}>{user.email}</p>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          background: user.isActive
                            ? COLORS.success
                            : COLORS.danger
                        }}
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div style={styles.userMeta}>
                      <span style={styles.roleBadge}>{user.role}</span>
                      <span>ID: {user.id}</span>
                    </div>

                    <div style={styles.userActions}>
                      <button
                        style={styles.smallButton}
                        onClick={() => handleEdit(user)}
                      >
                        Editar
                      </button>

                      <button
                        style={{
                          ...styles.toggleButton,
                          background: user.isActive
                            ? COLORS.danger
                            : COLORS.success
                        }}
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.isActive ? "Desactivar" : "Activar"}
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

function MetricCard({ label, value }) {
  return (
    <article style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </article>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
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
  sessionCard: {
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "22px",
    padding: "18px 22px",
    color: COLORS.primary,
    marginBottom: "22px"
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
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
  roleInfo: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "6px",
    fontSize: "14px"
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
  usersCard: {
    background: COLORS.white,
    borderRadius: "24px",
    border: `1px solid ${COLORS.border}`,
    padding: "24px",
    boxShadow: "0 10px 26px rgba(11, 46, 107, 0.06)"
  },
  usersHeader: {
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
  userList: {
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
  userItem: {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    gap: "16px"
  },
  avatar: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    flexShrink: 0
  },
  userMain: {
    flex: 1,
    display: "grid",
    gap: "12px"
  },
  userTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px"
  },
  userName: {
    margin: "0 0 6px",
    color: COLORS.text,
    fontSize: "22px"
  },
  userEmail: {
    margin: 0,
    color: COLORS.textSoft,
    fontSize: "15px"
  },
  statusBadge: {
    color: COLORS.white,
    borderRadius: "999px",
    padding: "7px 12px",
    fontWeight: "900",
    fontSize: "13px",
    height: "fit-content"
  },
  userMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    color: COLORS.primary,
    fontSize: "15px"
  },
  roleBadge: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "999px",
    padding: "7px 12px",
    fontWeight: "900"
  },
  userActions: {
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
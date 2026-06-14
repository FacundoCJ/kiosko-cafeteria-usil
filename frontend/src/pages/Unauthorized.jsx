import React from "react";
import { getCurrentUser, logout } from "../services/auth.service.js";

const COLORS = {
  primary: "#0B2E6B",
  primaryLight: "#EAF1FF",
  white: "#FFFFFF",
  background: "#F5F7FB",
  text: "#162033",
  textSoft: "#5B6780",
  border: "#D7E1F2",
  danger: "#D72638"
};

export default function Unauthorized({
  suggestedPath = "/",
  suggestedLabel = "Continuar"
}) {
  const user = getCurrentUser();

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>USIL</div>

        <h1 style={styles.title}>Acceso no autorizado</h1>

        <p style={styles.subtitle}>
          Tu usuario inició sesión correctamente, pero tu rol no tiene permisos
          para ingresar a esta sección.
        </p>

        <div style={styles.infoBox}>
          <strong>Sesión actual</strong>
          <span>{user?.name || "Usuario"}</span>
          <span>{user?.email || "Sin correo"}</span>
          <span>Rol: {user?.role || "Sin rol"}</span>
        </div>

        <div style={styles.actions}>
          <a href={suggestedPath} style={styles.primaryButton}>
            {suggestedLabel}
          </a>

          <a href="/login" style={styles.secondaryButton}>
            Iniciar sesión con otra cuenta
          </a>

          <a href="/" style={styles.secondaryButton}>
            Ir al kiosko público
          </a>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
    color: COLORS.text
  },
  card: {
    width: "100%",
    maxWidth: "660px",
    background: COLORS.white,
    borderRadius: "32px",
    border: `1px solid ${COLORS.border}`,
    padding: "38px",
    textAlign: "center",
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)"
  },
  logo: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    background: COLORS.primary,
    color: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 22px",
    fontSize: "28px",
    fontWeight: "900"
  },
  title: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "42px"
  },
  subtitle: {
    margin: "14px 0 0",
    color: COLORS.textSoft,
    fontSize: "18px",
    lineHeight: 1.5
  },
  infoBox: {
    margin: "28px 0",
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "18px",
    display: "grid",
    gap: "7px",
    color: COLORS.primary
  },
  actions: {
    display: "grid",
    gap: "12px"
  },
  primaryButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    textDecoration: "none"
  },
  secondaryButton: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    textDecoration: "none"
  },
  logoutButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer"
  }
};
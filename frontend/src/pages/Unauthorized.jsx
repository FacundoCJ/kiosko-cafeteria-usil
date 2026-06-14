import React from "react";
import logoUsilCuadradoImg from "../assets/branding/logo-usil-cuadrado.png";
import {
  getCurrentUser,
  logout,
  switchAccount
} from "../services/auth.service.js";

const COLORS = {
  primary: "#0B2E6B",
  primaryLight: "#EAF1FF",
  white: "#FFFFFF",
  background: "#F5F7FB",
  text: "#162033",
  textSoft: "#5B6780",
  border: "#D7E1F2",
  danger: "#D72638",
  dangerLight: "#FFE9EC"
};

export default function Unauthorized({
  suggestedPath = "/",
  suggestedLabel = "Continuar"
}) {
  const user = getCurrentUser();

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logoBox}>
          <img src={logoUsilCuadradoImg} alt="USIL" style={styles.logoImage} />
        </div>

        <h1 style={styles.title}>Acceso no autorizado</h1>

        <p style={styles.subtitle}>
          Tu usuario inició sesión correctamente, pero tu rol no tiene permisos
          para ingresar a esta sección del sistema.
        </p>

        <div style={styles.infoBox}>
          <strong>Sesión actual</strong>
          <span>{user?.name || "Usuario"}</span>
          <span>{user?.email || "Sin correo"}</span>
          <span>Rol: {formatRole(user?.role)}</span>
        </div>

        <div style={styles.warningBox}>
          Para ingresar con otra cuenta, primero se cerrará la sesión actual y
          luego se abrirá nuevamente la pantalla de acceso.
        </div>

        <div style={styles.actions}>
          <a href={suggestedPath} style={styles.primaryButton}>
            {suggestedLabel}
          </a>

          <button style={styles.secondaryButton} onClick={switchAccount}>
            Iniciar sesión con otra cuenta
          </button>

          <a href="/" style={styles.secondaryLink}>
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

function formatRole(role) {
  const labels = {
    ADMIN: "Administrador",
    CAFETERIA: "Cafetería",
    COCINA: "Cocina"
  };

  return labels[role] || role || "Sin rol";
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
    color: COLORS.text,
    boxSizing: "border-box"
  },
  card: {
    width: "100%",
    maxWidth: "680px",
    background: COLORS.white,
    borderRadius: "34px",
    border: `1px solid ${COLORS.border}`,
    padding: "38px",
    textAlign: "center",
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)",
    boxSizing: "border-box"
  },
  logoBox: {
    width: "112px",
    height: "112px",
    borderRadius: "26px",
    overflow: "hidden",
    background: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 14px 32px rgba(11, 46, 107, 0.16)",
    margin: "0 auto 22px"
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
    margin: "14px 0 0",
    color: COLORS.textSoft,
    fontSize: "18px",
    lineHeight: 1.5
  },
  infoBox: {
    margin: "28px 0 14px",
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "22px",
    padding: "18px",
    display: "grid",
    gap: "7px",
    color: COLORS.primary,
    boxSizing: "border-box"
  },
  warningBox: {
    marginBottom: "22px",
    background: COLORS.dangerLight,
    color: COLORS.danger,
    border: "1px solid #FFC7D0",
    borderRadius: "18px",
    padding: "14px",
    fontWeight: "800",
    lineHeight: 1.4,
    boxSizing: "border-box"
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
    textDecoration: "none",
    boxSizing: "border-box"
  },
  secondaryButton: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  secondaryLink: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    textDecoration: "none",
    boxSizing: "border-box"
  },
  logoutButton: {
    background: COLORS.danger,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer",
    boxSizing: "border-box"
  }
};
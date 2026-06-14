import React, { useState } from "react";
import { saveSession } from "../services/auth.service.js";

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
  danger: "#D72638"
};

export default function Login() {
  const [email, setEmail] = useState("admin@usil.edu.pe");
  const [password, setPassword] = useState("Admin123");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo iniciar sesión");
      }

      saveSession(data.token, data.user);
      window.location.href = "/admin";
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandBox}>
          <div style={styles.logo}>USIL</div>

          <div>
            <h1 style={styles.title}>Acceso administrativo</h1>
            <p style={styles.subtitle}>
              Sistema de Kiosko Táctil para Autoservicio - Cafetería USIL
            </p>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleLogin}>
          <label style={styles.label}>
            Correo institucional
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@usil.edu.pe"
              required
            />
          </label>

          <label style={styles.label}>
            Contraseña
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </label>

          {message && <p style={styles.error}>{message}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar al panel"}
          </button>

          <a href="/" style={styles.kioskLink}>
            Volver al kiosko
          </a>
        </form>

        <div style={styles.helperBox}>
          <strong>Usuario de prueba</strong>
          <span>Correo: admin@usil.edu.pe</span>
          <span>Contraseña: Admin123</span>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 45%, ${COLORS.primaryLight} 45%, ${COLORS.background} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
    color: COLORS.text
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    background: COLORS.white,
    borderRadius: "32px",
    border: `1px solid ${COLORS.border}`,
    padding: "34px",
    boxShadow: "0 26px 70px rgba(11, 46, 107, 0.24)"
  },
  brandBox: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    marginBottom: "28px"
  },
  logo: {
    width: "82px",
    height: "82px",
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
  title: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "34px",
    lineHeight: 1
  },
  subtitle: {
    margin: "10px 0 0",
    color: COLORS.textSoft,
    fontSize: "15px",
    lineHeight: 1.4
  },
  form: {
    display: "grid",
    gap: "18px"
  },
  label: {
    display: "grid",
    gap: "8px",
    fontWeight: "800",
    color: COLORS.text
  },
  input: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "15px 16px",
    fontSize: "17px",
    outline: "none",
    color: COLORS.text,
    background: COLORS.white
  },
  button: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "18px",
    padding: "17px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer"
  },
  kioskLink: {
    textAlign: "center",
    color: COLORS.primary,
    textDecoration: "none",
    fontWeight: "800"
  },
  error: {
    margin: 0,
    background: "#FFE9EC",
    color: COLORS.danger,
    border: "1px solid #FFC8D0",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: "800"
  },
  helperBox: {
    marginTop: "24px",
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "16px",
    display: "grid",
    gap: "6px",
    color: COLORS.primary,
    fontSize: "14px"
  }
};
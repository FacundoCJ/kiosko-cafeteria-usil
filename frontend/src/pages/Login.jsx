import React, { useState } from "react";
import logoUsilCuadradoImg from "../assets/branding/logo-usil-cuadrado.png";
import { saveSession } from "../services/auth.service.js";

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
  danger: "#D72638"
};

export default function Login() {
  const [email, setEmail] = useState("admin@usil.edu.pe");
  const [password, setPassword] = useState("Admin123");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role) => {
    if (role === "ADMIN") {
      window.location.href = "/admin";
      return;
    }

    if (role === "CAFETERIA") {
      window.location.href = "/admin/pedidos";
      return;
    }

    if (role === "COCINA") {
      window.location.href = "/admin/pedidos";
      return;
    }

    window.location.href = "/";
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Ingresa correo y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo iniciar sesión");
      }

      saveSession(data.token, data.user);
      redirectByRole(data.user.role);
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
        <div style={styles.logoBox}>
          <img src={logoUsilCuadradoImg} alt="USIL" style={styles.logoImage} />
        </div>

        <h1 style={styles.title}>Acceso interno</h1>

        <p style={styles.subtitle}>
          Ingresa con una cuenta autorizada para administrar pedidos, productos,
          reportes o usuarios del kiosko.
        </p>

        {message && <p style={styles.error}>{message}</p>}

        <form style={styles.form} onSubmit={handleLogin}>
          <label style={styles.label}>
            Correo institucional
            <input
              style={styles.input}
              type="email"
              value={email}
              placeholder="admin@usil.edu.pe"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label style={styles.label}>
            Contraseña
            <input
              style={styles.input}
              type="password"
              value={password}
              placeholder="Ingresa tu contraseña"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button style={styles.loginButton} type="submit" disabled={loading}>
            {loading ? "Validando acceso..." : "Iniciar sesión"}
          </button>
        </form>

        <div style={styles.helpBox}>
          <strong>Roles del sistema</strong>
          <span>ADMIN: acceso completo.</span>
          <span>CAFETERIA: pedidos, productos y reportes.</span>
          <span>COCINA: pedidos y preparación.</span>
        </div>

        <a href="/" style={styles.publicLink}>
          Volver al kiosko público
        </a>
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
    maxWidth: "520px",
    background: COLORS.white,
    borderRadius: "34px",
    border: `1px solid ${COLORS.border}`,
    padding: "38px",
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)"
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
    textAlign: "center",
    fontSize: "42px"
  },
  subtitle: {
    margin: "12px 0 26px",
    color: COLORS.textSoft,
    textAlign: "center",
    fontSize: "17px",
    lineHeight: 1.5
  },
  form: {
    display: "grid",
    gap: "16px"
  },
  label: {
    display: "grid",
    gap: "8px",
    color: COLORS.text,
    fontWeight: "900"
  },
  input: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "15px 16px",
    fontSize: "16px",
    outline: "none",
    color: COLORS.text,
    background: COLORS.white
  },
  loginButton: {
    marginTop: "6px",
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "16px 24px",
    fontSize: "17px",
    fontWeight: "900",
    cursor: "pointer"
  },
  helpBox: {
    marginTop: "22px",
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "20px",
    padding: "16px",
    display: "grid",
    gap: "6px",
    color: COLORS.primary,
    fontSize: "14px"
  },
  publicLink: {
    display: "block",
    marginTop: "18px",
    textAlign: "center",
    background: COLORS.white,
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "14px 20px",
    fontWeight: "900",
    textDecoration: "none"
  },
  error: {
    background: "#FFE9EC",
    color: COLORS.danger,
    borderRadius: "16px",
    padding: "14px",
    fontWeight: "800",
    marginBottom: "16px",
    textAlign: "center"
  }
};
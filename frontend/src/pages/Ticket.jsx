import React, { useEffect, useMemo, useState } from "react";

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

export default function Ticket() {
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  const orderNumber = useMemo(() => {
    const parts = window.location.pathname.split("/");
    return parts[2] || "";
  }, []);

  const loadTicket = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/orders/public/ticket/${orderNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar el ticket");
      }

      setTicket(data.ticket);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error al cargar ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, []);

  useEffect(() => {
    if (!ticket) return;

    const countdownInterval = setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          clearInterval(countdownInterval);
          window.location.href = "/";
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [ticket]);

  return (
    <main style={styles.page}>
      <style>
        {`
          @media print {
            body {
              background: #ffffff !important;
            }

            .no-print {
              display: none !important;
            }

            .ticket-page {
              min-height: auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              display: block !important;
            }

            .ticket-card {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              padding: 12px !important;
            }

            .ticket-box {
              border: 1px solid #000000 !important;
            }

            @page {
              margin: 12mm;
              size: auto;
            }
          }
        `}
      </style>

      <section style={styles.card} className="ticket-card">
        <div style={styles.header}>
          <div style={styles.logo}>USIL</div>

          <div>
            <h1 style={styles.title}>Comprobante de pedido</h1>
            <p style={styles.subtitle}>
              Cafetería USIL · Kiosko de autoservicio
            </p>
          </div>
        </div>

        {loading && <p style={styles.message}>Cargando comprobante...</p>}
        {message && <p style={styles.error}>{message}</p>}

        {ticket && (
          <section style={styles.ticketBox} className="ticket-box">
            <div style={styles.ticketTop}>
              <span>Número de pedido</span>
              <strong>{ticket.orderNumber}</strong>
            </div>

            <div style={styles.infoGrid}>
              <div>
                <span>Fecha</span>
                <strong>{formatDate(ticket.createdAt)}</strong>
              </div>

              <div>
                <span>Hora</span>
                <strong>{formatTime(ticket.createdAt)}</strong>
              </div>

              <div>
                <span>Método de pago</span>
                <strong>{formatMethod(ticket.paymentMethod)}</strong>
              </div>

              <div>
                <span>Estado</span>
                <strong>{formatStatus(ticket.status)}</strong>
              </div>
            </div>

            <div style={styles.divider} />

            <h2 style={styles.sectionTitle}>Detalle del pedido</h2>

            <div style={styles.items}>
              {ticket.items.map((item, index) => (
                <div key={`${item.name}-${index}`} style={styles.itemRow}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.quantity} x S/ {item.unitPrice.toFixed(2)}
                    </span>
                  </div>

                  <strong>S/ {item.subtotal.toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div style={styles.totalRow}>
              <span>Total pagado</span>
              <strong>S/ {ticket.total.toFixed(2)}</strong>
            </div>

            <div style={styles.notice}>
              Conserva este número para recoger tu pedido. Revisa la pantalla de
              retiro de la cafetería y acércate cuando aparezca como listo.
            </div>
          </section>
        )}

        {ticket && (
          <div style={styles.autoBox} className="no-print">
            La pantalla volverá automáticamente al kiosko en{" "}
            <strong>{secondsLeft}</strong> segundos.
          </div>
        )}

        <div style={styles.actions} className="no-print">
          <button style={styles.printButton} onClick={() => window.print()}>
            Imprimir ticket
          </button>

          <a href="/" style={styles.newOrderButton}>
            Iniciar nuevo pedido
          </a>
        </div>
      </section>
    </main>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatMethod(method) {
  const labels = {
    yape: "Yape",
    plin: "Plin",
    tarjeta: "Tarjeta",
    qr: "QR",
    pendiente: "Pendiente"
  };

  return labels[method] || method;
}

function formatStatus(status) {
  const labels = {
    pendiente: "Pendiente",
    pagado: "Pagado",
    preparando: "En preparación",
    listo: "Listo",
    entregado: "Entregado",
    cancelado: "Cancelado"
  };

  return labels[status] || status;
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
    maxWidth: "720px",
    background: COLORS.white,
    borderRadius: "32px",
    border: `1px solid ${COLORS.border}`,
    padding: "34px",
    boxShadow: "0 24px 70px rgba(11, 46, 107, 0.16)"
  },
  header: {
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
    fontWeight: "900"
  },
  title: {
    margin: 0,
    color: COLORS.primary,
    fontSize: "36px"
  },
  subtitle: {
    margin: "8px 0 0",
    color: COLORS.textSoft,
    fontSize: "16px"
  },
  ticketBox: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "24px",
    padding: "24px",
    background: "#FFFFFF"
  },
  ticketTop: {
    background: COLORS.primaryLight,
    borderRadius: "20px",
    padding: "22px",
    display: "grid",
    gap: "8px",
    color: COLORS.primary,
    textAlign: "center"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "14px",
    marginTop: "18px"
  },
  divider: {
    height: "1px",
    background: COLORS.border,
    margin: "24px 0"
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: COLORS.primary,
    fontSize: "24px"
  },
  items: {
    display: "grid",
    gap: "12px"
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    background: COLORS.background,
    borderRadius: "16px",
    padding: "14px"
  },
  totalRow: {
    borderTop: `2px solid ${COLORS.border}`,
    marginTop: "18px",
    paddingTop: "18px",
    display: "flex",
    justifyContent: "space-between",
    color: COLORS.primary,
    fontSize: "24px"
  },
  notice: {
    marginTop: "20px",
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "18px",
    padding: "16px",
    fontWeight: "800",
    lineHeight: 1.4
  },
  autoBox: {
    marginTop: "18px",
    background: "#E9F8EF",
    color: COLORS.success,
    borderRadius: "16px",
    padding: "14px",
    textAlign: "center",
    fontWeight: "800"
  },
  actions: {
    marginTop: "22px",
    display: "grid",
    gap: "12px"
  },
  printButton: {
    background: COLORS.primary,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer"
  },
  newOrderButton: {
    background: COLORS.success,
    color: COLORS.white,
    border: "none",
    borderRadius: "999px",
    padding: "15px 24px",
    fontWeight: "900",
    fontSize: "16px",
    textAlign: "center",
    textDecoration: "none"
  },
  message: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: "16px",
    padding: "14px",
    fontWeight: "800"
  },
  error: {
    background: "#FFE9EC",
    color: COLORS.danger,
    borderRadius: "16px",
    padding: "14px",
    fontWeight: "800"
  }
};
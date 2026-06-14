import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;
const APP_NAME = process.env.APP_NAME || "Kiosko Cafetería USIL";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: `${APP_NAME} - API principal activa`,
    version: "1.0.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend del Kiosko Cafetería USIL funcionando correctamente",
    service: "backend",
    status: "active"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`${APP_NAME}`);
  console.log(`Servidor backend activo en puerto ${PORT}`);
  console.log(`URL local: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Productos: http://localhost:${PORT}/api/products`);
  console.log(`Pedidos: http://localhost:${PORT}/api/orders`);
  console.log(`Pagos: http://localhost:${PORT}/api/payments`);
  console.log("=====================================");
});
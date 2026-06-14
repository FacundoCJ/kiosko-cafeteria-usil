# Sistema de Kiosko Táctil para Autoservicio – Cafetería USIL

Sistema web desarrollado para optimizar el proceso de atención en la Cafetería USIL mediante un kiosko táctil de autoservicio. La solución permite que los usuarios seleccionen productos, realicen pedidos, simulen pagos electrónicos, generen comprobantes y visualicen el estado de preparación y retiro de sus pedidos.

El proyecto incluye un frontend público para el kiosko, paneles administrativos por rol, backend con API REST, base de datos PostgreSQL y persistencia mediante Prisma ORM.

---

## 1. Descripción general

El sistema busca reducir tiempos de espera, ordenar la gestión de pedidos y mejorar la experiencia de compra dentro de la cafetería. Está diseñado como una solución modular que puede ser presentada como demo funcional, piloto institucional o base para una implementación real.

El flujo principal permite:

1. El usuario ingresa al kiosko público.
2. Selecciona productos del catálogo.
3. Revisa su pedido en el carrito.
4. Selecciona método de pago.
5. Confirma el pedido.
6. Recibe un número de pedido y comprobante.
7. El personal de cafetería/cocina gestiona la preparación.
8. La pantalla pública de retiro muestra los pedidos listos.

---

## 2. Características principales

### Kiosko público

* Pantalla de bienvenida institucional.
* Catálogo de productos por categorías.
* Imágenes reales de productos.
* Vista responsive para pantalla vertical y horizontal.
* Carrito de compras.
* Modal de pedido en vista vertical.
* Validación de stock disponible.
* Métodos de pago visuales:

  * Yape
  * Plin
  * Tarjeta
  * QR
* Confirmación de pedido.
* Generación de comprobante.

### Ticket / comprobante

* Número de pedido.
* Fecha y hora.
* Estado del pedido.
* Método de pago.
* Detalle de productos.
* Total pagado.
* Logo institucional USIL.
* Opción de impresión.
* Retorno automático al kiosko.

### Pantalla de retiro

* Visualización pública de pedidos en preparación.
* Visualización pública de pedidos listos para recoger.
* Actualización automática.
* Diseño institucional con logo USIL.
* Contadores de pedidos por estado.

### Panel de cafetería / cocina

* Gestión de pedidos por columnas:

  * Pagados
  * En preparación
  * Listos
  * Entregados
* Cambio de estado de pedidos.
* Control de flujo operativo.
* Restricción de acciones según rol.

### Gestión de productos

* Crear productos.
* Editar productos.
* Actualizar stock.
* Activar/desactivar productos.
* Eliminar productos para usuario administrador.
* Vista previa de imagen asignada.
* Filtros por categoría y estado.
* Métricas de productos activos, inactivos, stock bajo y sin stock.

### Reportes gerenciales

* Ventas totales.
* Pedidos totales.
* Ticket promedio.
* Productos vendidos.
* Pedidos pagados.
* Pedidos entregados.
* Pedidos pendientes.
* Productos con stock bajo.
* Ranking de productos más vendidos.
* Ventas por método de pago.
* Pedidos por estado.
* Ventas por día.
* Filtro por rango de fechas.

### Gestión de usuarios

* Crear usuarios internos.
* Editar usuarios.
* Activar/desactivar cuentas.
* Roles disponibles:

  * Administrador
  * Cafetería
  * Cocina
* Filtros por rol, estado y búsqueda.
* Control de permisos.
* Pantalla de acceso no autorizado.
* Cambio de cuenta seguro.

---

## 3. Tecnologías utilizadas

### Frontend

* React
* Vite
* JavaScript
* CSS inline mediante objetos de estilos
* Diseño responsive

### Backend

* Node.js
* Express
* Prisma ORM
* JWT para autenticación
* Bcrypt para cifrado de contraseñas
* CORS
* Dotenv

### Base de datos

* PostgreSQL
* Docker
* Prisma Migrations
* Prisma Studio

---

## 4. Roles del sistema

### ADMIN

Rol con acceso completo al sistema.

Permisos:

* Gestionar pedidos.
* Gestionar productos.
* Ver reportes.
* Gestionar usuarios.
* Activar/desactivar usuarios.
* Eliminar productos.
* Acceder al kiosko público.

Rutas principales:

```text
/admin
/admin/pedidos
/admin/productos
/admin/reportes
/admin/usuarios
```

### CAFETERIA

Rol operativo para personal de cafetería.

Permisos:

* Gestionar pedidos.
* Gestionar productos.
* Ver reportes.
* Entregar pedidos.
* Acceder al kiosko público.

Rutas principales:

```text
/admin/pedidos
/admin/productos
/admin/reportes
```

### COCINA

Rol operativo para preparación de pedidos.

Permisos:

* Ver pedidos.
* Marcar pedidos como en preparación.
* Marcar pedidos como listos.
* Acceder al kiosko público.

Rutas principales:

```text
/admin/pedidos
```

---

## 5. Rutas principales del frontend

```text
/                         Kiosko público
/login                    Acceso interno
/ticket/:orderNumber      Comprobante del pedido
/pantalla-pedidos         Pantalla pública de retiro

/admin                    Panel principal de administrador
/admin/pedidos            Gestión de pedidos
/admin/productos          Gestión de productos
/admin/reportes           Reportes gerenciales
/admin/usuarios           Gestión de usuarios
```

---

## 6. Estructura del proyecto

```text
kiosko-cafeteria-usil/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.cjs
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── orders.controller.js
│   │   │   ├── payments.controller.js
│   │   │   ├── products.controller.js
│   │   │   ├── reports.controller.js
│   │   │   └── users.controller.js
│   │   ├── database/
│   │   │   └── createAdmin.js
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── payments.routes.js
│   │   │   ├── products.routes.js
│   │   │   ├── reports.routes.js
│   │   │   └── users.routes.js
│   │   ├── services/
│   │   │   └── token.service.js
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── prisma.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── branding/
│   │   │   ├── pagos/
│   │   │   └── productos/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── OrderDisplay.jsx
│   │   │   ├── ProductManagement.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Ticket.jsx
│   │   │   ├── Unauthorized.jsx
│   │   │   └── UserManagement.jsx
│   │   ├── services/
│   │   │   └── auth.service.js
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── arquitectura.md
│   ├── endpoints.md
│   └── pruebas.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 7. Requisitos previos

Para ejecutar el proyecto se necesita:

* Node.js
* npm
* Docker
* Docker Compose
* PostgreSQL mediante Docker
* Git
* Prisma CLI mediante dependencias del backend

---

## 8. Instalación del proyecto

### 8.1. Clonar el repositorio

```bash
git clone https://github.com/FacundoCJ/kiosko-cafeteria-usil.git
cd kiosko-cafeteria-usil
```

### 8.2. Levantar PostgreSQL con Docker

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Verificar que el contenedor esté activo:

```bash
docker ps
```

### 8.3. Configurar variables de entorno del backend

Crear el archivo:

```text
backend/.env
```

Contenido recomendado para desarrollo:

```env
PORT=4000
APP_NAME=Kiosko Cafetería USIL
NODE_ENV=development
DATABASE_URL="postgresql://kiosko_user:kiosko_password@localhost:5432/kiosko_cafeteria_usil?schema=public"
JWT_SECRET="kiosko_usil_super_secret_dev_2026"
```

En producción se debe cambiar obligatoriamente `JWT_SECRET`, credenciales de base de datos y contraseñas iniciales.

### 8.4. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 8.5. Generar cliente Prisma

```bash
npx prisma generate
```

### 8.6. Ejecutar migraciones

```bash
npx prisma migrate dev
```

### 8.7. Crear usuario administrador inicial

```bash
node src/database/createAdmin.js
```

### 8.8. Instalar dependencias del frontend

Desde la raíz del proyecto:

```bash
cd ../frontend
npm install
```

---

## 9. Ejecución del proyecto

### 9.1. Ejecutar backend

```bash
cd backend
npm run dev
```

Backend disponible en:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

### 9.2. Ejecutar frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

Frontend disponible en:

```text
http://localhost:5173
```

En GitHub Codespaces, abrir el puerto correspondiente desde la pestaña de puertos.

---

## 10. Credenciales de prueba

### Administrador

```text
Correo: admin@usil.edu.pe
Contraseña: Admin123
Rol: ADMIN
```

### Cafetería

```text
Correo: cafeteria@usil.edu.pe
Contraseña: Cafe123
Rol: CAFETERIA
```

### Cocina

```text
Correo: cocina@usil.edu.pe
Contraseña: Cocina123
Rol: COCINA
```

Estas credenciales son únicamente para entorno de desarrollo o demostración.

---

## 11. Endpoints principales del backend

### Autenticación

```text
POST /api/auth/login
GET  /api/auth/me
```

### Productos

```text
GET    /api/products
GET    /api/products/:id
GET    /api/products/admin/categories
POST   /api/products
PUT    /api/products/:id
PATCH  /api/products/:id/stock
PATCH  /api/products/:id/toggle-status
DELETE /api/products/:id
```

### Pedidos

```text
POST  /api/orders
GET   /api/orders
GET   /api/orders/:id
PATCH /api/orders/:id/status
GET   /api/orders/public/status
GET   /api/orders/public/ticket/:orderNumber
```

### Pagos

```text
POST /api/payments/simulate
GET  /api/payments
GET  /api/payments/:id
```

### Reportes

```text
GET /api/reports/summary
GET /api/reports/top-products
GET /api/reports/sales-by-day
```

### Usuarios

```text
GET   /api/users
GET   /api/users/:id
POST  /api/users
PUT   /api/users/:id
PATCH /api/users/:id/toggle-status
```

---

## 12. Flujo de uso recomendado para demo

### Flujo público

1. Ingresar a `/`.
2. Presionar **Iniciar pedido**.
3. Seleccionar productos del catálogo.
4. Revisar el carrito.
5. Seleccionar método de pago.
6. Confirmar pedido.
7. Abrir el comprobante.
8. Imprimir o iniciar un nuevo pedido.

### Flujo cocina

1. Ingresar a `/login`.
2. Iniciar sesión con usuario de cocina.
3. Ir a `/admin/pedidos`.
4. Marcar pedidos como **preparando**.
5. Marcar pedidos como **listos**.

### Flujo cafetería

1. Ingresar a `/login`.
2. Iniciar sesión con usuario de cafetería.
3. Gestionar pedidos.
4. Gestionar productos.
5. Revisar reportes.
6. Marcar pedidos como entregados.

### Flujo administrador

1. Ingresar a `/login`.
2. Iniciar sesión como administrador.
3. Gestionar usuarios.
4. Gestionar productos.
5. Revisar reportes.
6. Supervisar pedidos.

---

## 13. Pruebas básicas recomendadas

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
npm run dev
```

### Health check

```bash
curl http://localhost:4000/api/health
```

### Consulta de productos

```bash
curl http://localhost:4000/api/products
```

### Login de administrador

```bash
curl -X POST http://localhost:4000/api/auth/login \
-H "Content-Type: application/json" \
--data '{"email":"admin@usil.edu.pe","password":"Admin123"}'
```

---

## 14. Seguridad y permisos

El sistema usa autenticación mediante JWT. Las rutas administrativas están protegidas por middleware de autenticación y autorización por roles.

Medidas implementadas:

* Contraseñas cifradas con bcrypt.
* Sesión guardada en localStorage.
* Token JWT para consumo de endpoints protegidos.
* Restricción de rutas por rol.
* Pantalla de acceso no autorizado.
* Cambio de cuenta con limpieza previa de sesión.
* Protección contra usuarios inactivos.
* Validación de stock antes de crear pedidos.

Para producción se recomienda:

* Usar HTTPS.
* Cambiar secretos JWT.
* Configurar variables de entorno seguras.
* Usar proveedor real de pagos.
* Configurar backups de base de datos.
* Implementar logs de auditoría.
* Configurar expiración y refresh token.
* Implementar monitoreo de errores.

---

## 15. Estado actual del proyecto

El sistema se encuentra en estado funcional para demo completa.

Módulos completados:

```text
Kiosko público: completo
Ticket/comprobante: completo
Pantalla de retiro: completo
Panel de pedidos: completo
Gestión de productos: completo
Reportes gerenciales: completo
Gestión de usuarios: completo
Roles y permisos: completo
Branding institucional: completo
Integración visual de pagos: completo
```

---

## 16. Posibles mejoras futuras

* Integración con pasarela de pago real.
* Generación de QR dinámico por pedido.
* Notificaciones en tiempo real con WebSockets.
* Panel de cocina separado para tablets.
* Exportación de reportes a Excel o PDF.
* Historial detallado por usuario.
* Control de horarios de atención.
* Gestión de promociones.
* Integración con impresora térmica.
* Modo pantalla completa para kiosko físico.
* Registro de auditoría para acciones administrativas.
* Dashboard con gráficos avanzados.

---

## 17. Autor

Proyecto desarrollado por:

```text
Facundo Córdova
Ingeniería de Sistemas
Universidad San Ignacio de Loyola
```

---

## 18. Nombre del proyecto

```text
Sistema de Kiosko Táctil para Autoservicio – Cafetería USIL
```

---

## 19. Licencia

Proyecto desarrollado con fines académicos y de demostración funcional. Su uso institucional o comercial requiere revisión, validación técnica y autorización correspondiente.

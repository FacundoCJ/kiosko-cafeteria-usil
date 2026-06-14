# Documentación de Endpoints – Kiosko Cafetería USIL

## 1. Información general

API REST del sistema **Sistema de Kiosko Táctil para Autoservicio – Cafetería USIL**.

La API permite gestionar productos, pedidos, pagos simulados, reportes, usuarios y autenticación interna.

```text
Backend: Node.js + Express
Base de datos: PostgreSQL
ORM: Prisma
Autenticación: JWT
Formato de intercambio: JSON
URL base local: http://localhost:4000
Prefijo principal: /api
```

---

## 2. Convenciones generales

### 2.1. Formato de respuesta exitosa

La mayoría de respuestas exitosas siguen la estructura:

```json
{
  "ok": true,
  "message": "Operación realizada correctamente"
}
```

Algunas respuestas incluyen datos adicionales como:

```json
{
  "ok": true,
  "products": []
}
```

```json
{
  "ok": true,
  "order": {}
}
```

```json
{
  "ok": true,
  "user": {}
}
```

---

### 2.2. Formato de respuesta con error

```json
{
  "ok": false,
  "message": "Descripción del error"
}
```

---

### 2.3. Headers para rutas públicas

```http
Content-Type: application/json
```

---

### 2.4. Headers para rutas protegidas

```http
Content-Type: application/json
Authorization: Bearer TOKEN_JWT
```

---

## 3. Health check

### 3.1. Verificar estado del backend

```http
GET /api/health
```

Endpoint público usado para validar que el backend está activo.

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Backend del Kiosko Cafetería USIL funcionando correctamente",
  "service": "backend",
  "status": "active"
}
```

#### Ejemplo curl

```bash
curl http://localhost:4000/api/health
```

---

## 4. Autenticación

Prefijo:

```text
/api/auth
```

---

### 4.1. Iniciar sesión

```http
POST /api/auth/login
```

Permite iniciar sesión con un usuario interno del sistema.

#### Acceso

```text
Público
```

#### Body

```json
{
  "email": "admin@usil.edu.pe",
  "password": "Admin123"
}
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Inicio de sesión correcto",
  "token": "TOKEN_JWT",
  "user": {
    "id": 1,
    "name": "Administrador USIL",
    "email": "admin@usil.edu.pe",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-06-13T00:00:00.000Z",
    "updatedAt": "2026-06-13T00:00:00.000Z"
  }
}
```

#### Errores posibles

```json
{
  "ok": false,
  "message": "Correo y contraseña son obligatorios"
}
```

```json
{
  "ok": false,
  "message": "Credenciales inválidas"
}
```

```json
{
  "ok": false,
  "message": "Usuario inactivo"
}
```

#### Ejemplo curl

```bash
curl -X POST http://localhost:4000/api/auth/login \
-H "Content-Type: application/json" \
--data '{"email":"admin@usil.edu.pe","password":"Admin123"}'
```

---

### 4.2. Obtener perfil del usuario autenticado

```http
GET /api/auth/me
```

Devuelve los datos del usuario autenticado según el token JWT enviado.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA, COCINA
```

#### Headers

```http
Authorization: Bearer TOKEN_JWT
```

#### Respuesta esperada

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "name": "Administrador USIL",
    "email": "admin@usil.edu.pe",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-06-13T00:00:00.000Z",
    "updatedAt": "2026-06-13T00:00:00.000Z"
  }
}
```

---

## 5. Productos

Prefijo:

```text
/api/products
```

---

### 5.1. Listar productos activos

```http
GET /api/products
```

Devuelve productos disponibles para el kiosko público.

#### Acceso

```text
Público
```

#### Respuesta esperada

```json
{
  "ok": true,
  "products": [
    {
      "id": 1,
      "name": "Café americano",
      "description": "Café negro clásico servido caliente.",
      "price": 4.5,
      "stock": 22,
      "image": "coffee",
      "isActive": true,
      "category": "Bebidas calientes"
    }
  ]
}
```

#### Ejemplo curl

```bash
curl http://localhost:4000/api/products
```

---

### 5.2. Listar productos incluyendo inactivos

```http
GET /api/products?includeInactive=true
```

Usado por el panel de gestión de productos.

#### Acceso

```text
Público para consulta del frontend
```

#### Respuesta esperada

```json
{
  "ok": true,
  "products": []
}
```

---

### 5.3. Obtener producto por ID

```http
GET /api/products/:id
```

Obtiene el detalle de un producto específico.

#### Acceso

```text
Público
```

#### Parámetros

```text
id: ID numérico del producto
```

#### Ejemplo

```http
GET /api/products/1
```

#### Respuesta esperada

```json
{
  "ok": true,
  "product": {
    "id": 1,
    "name": "Café americano",
    "description": "Café negro clásico servido caliente.",
    "price": 4.5,
    "stock": 22,
    "image": "coffee",
    "isActive": true,
    "category": "Bebidas calientes"
  }
}
```

---

### 5.4. Listar categorías para administración

```http
GET /api/products/admin/categories
```

Devuelve las categorías registradas en la base de datos.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Respuesta esperada

```json
{
  "ok": true,
  "categories": [
    {
      "id": 1,
      "name": "Bebidas calientes"
    }
  ]
}
```

---

### 5.5. Crear producto

```http
POST /api/products
```

Crea un nuevo producto en el catálogo.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Body

```json
{
  "name": "Café americano",
  "description": "Café negro clásico servido caliente.",
  "price": 4.5,
  "stock": 25,
  "image": "coffee",
  "categoryId": 1
}
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Producto creado correctamente",
  "product": {
    "id": 1,
    "name": "Café americano",
    "description": "Café negro clásico servido caliente.",
    "price": 4.5,
    "stock": 25,
    "image": "coffee",
    "isActive": true,
    "categoryId": 1
  }
}
```

---

### 5.6. Actualizar producto

```http
PUT /api/products/:id
```

Actualiza los datos generales de un producto.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Body

```json
{
  "name": "Café americano",
  "description": "Café negro clásico servido caliente.",
  "price": 4.5,
  "stock": 22,
  "image": "coffee",
  "categoryId": 1
}
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Producto actualizado correctamente",
  "product": {}
}
```

---

### 5.7. Actualizar stock

```http
PATCH /api/products/:id/stock
```

Actualiza únicamente el stock de un producto.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Body

```json
{
  "stock": 30
}
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Stock actualizado correctamente",
  "product": {}
}
```

---

### 5.8. Activar o desactivar producto

```http
PATCH /api/products/:id/toggle-status
```

Cambia el estado activo/inactivo de un producto.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Estado del producto actualizado correctamente",
  "product": {}
}
```

---

### 5.9. Eliminar producto

```http
DELETE /api/products/:id
```

Elimina un producto del catálogo.

#### Acceso

```text
Protegido
Rol permitido: ADMIN
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Producto eliminado correctamente"
}
```

---

## 6. Pedidos

Prefijo:

```text
/api/orders
```

---

### 6.1. Crear pedido

```http
POST /api/orders
```

Crea un pedido desde el kiosko público.

#### Acceso

```text
Público
```

#### Body

```json
{
  "customerName": "Cliente kiosko",
  "items": [
    {
      "productId": 1,
      "quantity": 1
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Pedido creado correctamente",
  "order": {
    "id": 1,
    "orderNumber": "KIO-0001",
    "customerName": "Cliente kiosko",
    "total": 10.5,
    "paymentMethod": "pendiente",
    "status": "pendiente",
    "items": []
  }
}
```

#### Validaciones

```text
- El pedido debe tener al menos un producto.
- Cada producto debe existir.
- Cada producto debe estar activo.
- Debe existir stock suficiente.
- El stock se descuenta al crear el pedido.
```

---

### 6.2. Listar pedidos

```http
GET /api/orders
```

Devuelve pedidos registrados para el panel interno.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA, COCINA
```

#### Respuesta esperada

```json
{
  "ok": true,
  "orders": [
    {
      "id": 1,
      "orderNumber": "KIO-0001",
      "customerName": "Cliente kiosko",
      "total": 10.5,
      "paymentMethod": "yape",
      "status": "pagado",
      "items": []
    }
  ]
}
```

---

### 6.3. Obtener pedido por ID

```http
GET /api/orders/:id
```

Devuelve el detalle interno de un pedido.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA, COCINA
```

---

### 6.4. Actualizar estado de pedido

```http
PATCH /api/orders/:id/status
```

Actualiza el estado operativo de un pedido.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA, COCINA
```

#### Body

```json
{
  "status": "preparando"
}
```

#### Estados permitidos

```text
pendiente
pagado
preparando
listo
entregado
cancelado
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Estado del pedido actualizado correctamente",
  "order": {
    "id": 1,
    "orderNumber": "KIO-0001",
    "status": "preparando"
  }
}
```

---

### 6.5. Estado público de pedidos

```http
GET /api/orders/public/status
```

Devuelve pedidos para la pantalla pública de retiro.

#### Acceso

```text
Público
```

#### Respuesta esperada

```json
{
  "ok": true,
  "preparing": [
    {
      "id": 1,
      "orderNumber": "KIO-0001",
      "status": "preparando"
    }
  ],
  "ready": [
    {
      "id": 2,
      "orderNumber": "KIO-0002",
      "status": "listo"
    }
  ]
}
```

---

### 6.6. Ticket público por número de pedido

```http
GET /api/orders/public/ticket/:orderNumber
```

Devuelve el comprobante público de un pedido.

#### Acceso

```text
Público
```

#### Ejemplo

```http
GET /api/orders/public/ticket/KIO-0001
```

#### Respuesta esperada

```json
{
  "ok": true,
  "ticket": {
    "id": 1,
    "orderNumber": "KIO-0001",
    "customerName": "Cliente kiosko",
    "items": [
      {
        "name": "Café americano",
        "category": "Bebidas calientes",
        "unitPrice": 4.5,
        "quantity": 1,
        "subtotal": 4.5
      }
    ],
    "total": 4.5,
    "paymentMethod": "yape",
    "status": "pagado",
    "createdAt": "2026-06-13T00:00:00.000Z",
    "updatedAt": "2026-06-13T00:00:00.000Z"
  }
}
```

---

## 7. Pagos

Prefijo:

```text
/api/payments
```

---

### 7.1. Simular pago

```http
POST /api/payments/simulate
```

Simula el pago de un pedido.

#### Acceso

```text
Público
```

#### Body

```json
{
  "orderId": 1,
  "paymentMethod": "yape"
}
```

#### Métodos permitidos

```text
yape
plin
tarjeta
qr
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Pago simulado correctamente",
  "payment": {
    "id": 1,
    "transactionId": "TXN-000001",
    "orderId": 1,
    "orderNumber": "KIO-0001",
    "paymentMethod": "yape",
    "amount": 10.5,
    "status": "aprobado"
  },
  "order": {
    "id": 1,
    "orderNumber": "KIO-0001",
    "total": 10.5,
    "paymentMethod": "yape",
    "status": "pagado"
  }
}
```

---

### 7.2. Listar pagos

```http
GET /api/payments
```

Devuelve los pagos registrados.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

---

### 7.3. Obtener pago por ID

```http
GET /api/payments/:id
```

Devuelve el detalle de un pago.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

---

## 8. Reportes

Prefijo:

```text
/api/reports
```

---

### 8.1. Resumen gerencial

```http
GET /api/reports/summary
```

Devuelve métricas generales del sistema.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Query params opcionales

```text
startDate=YYYY-MM-DD
endDate=YYYY-MM-DD
```

#### Ejemplo

```http
GET /api/reports/summary?startDate=2026-06-07&endDate=2026-06-14
```

#### Respuesta esperada

```json
{
  "ok": true,
  "summary": {
    "totalOrders": 9,
    "paidOrders": 9,
    "deliveredOrders": 3,
    "pendingOrders": 6,
    "totalSales": 84.5,
    "averageTicket": 9.39,
    "totalProductsSold": 14,
    "totalProducts": 11,
    "activeProducts": 9,
    "inactiveProducts": 2,
    "lowStockProducts": 1,
    "salesByPaymentMethod": {
      "yape": 52,
      "qr": 8.5,
      "tarjeta": 24
    },
    "ordersByStatus": {
      "pagado": 4,
      "preparando": 1,
      "listo": 1,
      "entregado": 3
    }
  }
}
```

---

### 8.2. Productos más vendidos

```http
GET /api/reports/top-products
```

Devuelve ranking de productos con mayor venta.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Query params opcionales

```text
startDate=YYYY-MM-DD
endDate=YYYY-MM-DD
```

#### Respuesta esperada

```json
{
  "ok": true,
  "topProducts": [
    {
      "name": "Capuccino",
      "quantity": 4,
      "totalSales": 24
    }
  ]
}
```

---

### 8.3. Ventas por día

```http
GET /api/reports/sales-by-day
```

Devuelve ventas agrupadas por fecha.

#### Acceso

```text
Protegido
Roles permitidos: ADMIN, CAFETERIA
```

#### Query params opcionales

```text
startDate=YYYY-MM-DD
endDate=YYYY-MM-DD
```

#### Respuesta esperada

```json
{
  "ok": true,
  "salesByDay": [
    {
      "date": "2026-06-13",
      "totalOrders": 9,
      "totalSales": 84.5
    }
  ]
}
```

---

## 9. Usuarios

Prefijo:

```text
/api/users
```

---

### 9.1. Listar usuarios

```http
GET /api/users
```

Devuelve usuarios internos registrados.

#### Acceso

```text
Protegido
Rol permitido: ADMIN
```

#### Respuesta esperada

```json
{
  "ok": true,
  "users": [
    {
      "id": 1,
      "name": "Administrador USIL",
      "email": "admin@usil.edu.pe",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-06-13T00:00:00.000Z",
      "updatedAt": "2026-06-13T00:00:00.000Z"
    }
  ]
}
```

---

### 9.2. Obtener usuario por ID

```http
GET /api/users/:id
```

Devuelve el detalle de un usuario.

#### Acceso

```text
Protegido
Rol permitido: ADMIN
```

---

### 9.3. Crear usuario

```http
POST /api/users
```

Crea un usuario interno del sistema.

#### Acceso

```text
Protegido
Rol permitido: ADMIN
```

#### Body

```json
{
  "name": "Usuario Cocina",
  "email": "cocina@usil.edu.pe",
  "password": "Cocina123",
  "role": "COCINA",
  "isActive": true
}
```

#### Roles permitidos

```text
ADMIN
CAFETERIA
COCINA
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Usuario creado correctamente",
  "user": {
    "id": 3,
    "name": "Usuario Cocina",
    "email": "cocina@usil.edu.pe",
    "role": "COCINA",
    "isActive": true
  }
}
```

---

### 9.4. Actualizar usuario

```http
PUT /api/users/:id
```

Actualiza datos de un usuario interno.

#### Acceso

```text
Protegido
Rol permitido: ADMIN
```

#### Body

```json
{
  "name": "Usuario Cocina",
  "email": "cocina@usil.edu.pe",
  "password": "NuevaClave123",
  "role": "COCINA",
  "isActive": true
}
```

La contraseña puede omitirse si no se desea modificarla.

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Usuario actualizado correctamente",
  "user": {}
}
```

---

### 9.5. Activar o desactivar usuario

```http
PATCH /api/users/:id/toggle-status
```

Cambia el estado activo/inactivo de un usuario.

#### Acceso

```text
Protegido
Rol permitido: ADMIN
```

#### Respuesta esperada

```json
{
  "ok": true,
  "message": "Estado del usuario actualizado correctamente",
  "user": {}
}
```

---

## 10. Códigos de estado HTTP

| Código | Significado           | Uso                                             |
| ------ | --------------------- | ----------------------------------------------- |
| 200    | OK                    | Consulta o actualización correcta               |
| 201    | Created               | Recurso creado correctamente                    |
| 400    | Bad Request           | Datos incompletos o inválidos                   |
| 401    | Unauthorized          | Token ausente, inválido o usuario no autorizado |
| 403    | Forbidden             | Usuario sin permisos para la ruta               |
| 404    | Not Found             | Recurso no encontrado                           |
| 500    | Internal Server Error | Error interno del servidor                      |

---

## 11. Ejemplo de flujo completo con API

### 11.1. Crear pedido

```bash
curl -X POST http://localhost:4000/api/orders \
-H "Content-Type: application/json" \
--data '{
  "customerName": "Cliente kiosko",
  "items": [
    {
      "productId": 1,
      "quantity": 1
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}'
```

---

### 11.2. Simular pago

```bash
curl -X POST http://localhost:4000/api/payments/simulate \
-H "Content-Type: application/json" \
--data '{
  "orderId": 1,
  "paymentMethod": "yape"
}'
```

---

### 11.3. Consultar ticket

```bash
curl http://localhost:4000/api/orders/public/ticket/KIO-0001
```

---

### 11.4. Login administrador

```bash
curl -X POST http://localhost:4000/api/auth/login \
-H "Content-Type: application/json" \
--data '{"email":"admin@usil.edu.pe","password":"Admin123"}'
```

---

### 11.5. Guardar token en variable

```bash
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
-H "Content-Type: application/json" \
--data '{"email":"admin@usil.edu.pe","password":"Admin123"}')

TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token',''))")

echo $TOKEN
```

---

### 11.6. Consultar usuarios con token

```bash
curl http://localhost:4000/api/users \
-H "Authorization: Bearer $TOKEN"
```

---

## 12. Seguridad de endpoints

Las rutas públicas permiten operar el flujo del kiosko, pero no permiten administrar información sensible.

Las rutas protegidas requieren token JWT y validación de rol.

Resumen:

```text
Público:
- Ver productos activos
- Crear pedido
- Simular pago
- Ver ticket
- Ver pantalla pública de retiro

Protegido:
- Gestionar productos
- Gestionar pedidos internos
- Ver reportes
- Gestionar usuarios
- Consultar pagos
```

---

## 13. Observaciones

* El sistema usa pagos simulados para fines de demostración.
* Los métodos Yape, Plin, Tarjeta y QR son representaciones visuales y funcionales para demo.
* El QR usado es referencial.
* Las rutas administrativas deben consumirse siempre con token JWT.
* El sistema descuenta stock al crear pedidos.
* El panel de retiro se actualiza automáticamente desde el frontend.
* Los usuarios inactivos no pueden iniciar sesión.
* El cambio de cuenta limpia la sesión antes de abrir nuevamente el login.

---

## 14. Estado de la API

```text
Auth: Completo
Productos: Completo
Pedidos: Completo
Pagos simulados: Completo
Reportes: Completo
Usuarios: Completo
Pantalla pública de retiro: Completo
Ticket público: Completo
Seguridad por roles: Completo
```

---

## 15. Conclusión

La API del sistema permite cubrir el flujo completo de autoservicio, administración operativa y gestión gerencial de la cafetería. Los endpoints están organizados por módulos y protegidos según el nivel de acceso requerido.

La documentación permite probar, mantener y extender el backend del sistema de forma ordenada.

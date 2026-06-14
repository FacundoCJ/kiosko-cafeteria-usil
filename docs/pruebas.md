# Checklist de Pruebas Finales – Kiosko Cafetería USIL

Este documento registra las pruebas funcionales principales del sistema **Sistema de Kiosko Táctil para Autoservicio – Cafetería USIL**. El objetivo es validar que el flujo público, los paneles administrativos, los roles, los permisos, el ticket, la pantalla de retiro y la gestión de productos funcionen correctamente.

---

## 1. Información general

```text
Proyecto: Sistema de Kiosko Táctil para Autoservicio – Cafetería USIL
Frontend: React + Vite
Backend: Node.js + Express
Base de datos: PostgreSQL + Prisma
Entorno de prueba: GitHub Codespaces / Desarrollo local
```

---

## 2. Credenciales de prueba

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

---

## 3. Pruebas técnicas iniciales

| N.º | Prueba                               | Resultado esperado                             | Estado   |
| --- | ------------------------------------ | ---------------------------------------------- | -------- |
| 1   | Ejecutar backend con `npm run dev`   | El servidor inicia en el puerto 4000           | Aprobado |
| 2   | Ejecutar frontend con `npm run dev`  | Vite inicia correctamente                      | Aprobado |
| 3   | Ejecutar `npm run build` en frontend | El build se genera sin errores                 | Aprobado |
| 4   | Consultar `/api/health`              | Retorna estado activo del backend              | Aprobado |
| 5   | Consultar `/api/products`            | Retorna catálogo de productos activos          | Aprobado |
| 6   | Verificar conexión con PostgreSQL    | La API consulta y registra datos correctamente | Aprobado |
| 7   | Abrir Prisma Studio                  | Se visualizan tablas y registros               | Aprobado |

---

## 4. Pruebas del kiosko público

Ruta evaluada:

```text
/
```

| N.º | Prueba                                    | Resultado esperado                                 | Estado   |
| --- | ----------------------------------------- | -------------------------------------------------- | -------- |
| 1   | Abrir pantalla inicial del kiosko         | Se muestra bienvenida con logo USIL                | Aprobado |
| 2   | Presionar “Iniciar pedido”                | Redirige al catálogo de cafetería                  | Aprobado |
| 3   | Visualizar catálogo                       | Se muestran productos por categoría                | Aprobado |
| 4   | Ver imágenes de productos                 | Las imágenes cargan correctamente                  | Aprobado |
| 5   | Filtrar por categoría                     | Se muestran productos de la categoría seleccionada | Aprobado |
| 6   | Agregar producto al pedido                | Producto aparece en carrito                        | Aprobado |
| 7   | Agregar varias unidades                   | Cantidad y total se actualizan                     | Aprobado |
| 8   | Restar cantidad desde carrito             | Cantidad disminuye correctamente                   | Aprobado |
| 9   | Eliminar producto bajando cantidad a cero | Producto desaparece del carrito                    | Aprobado |
| 10  | Validar stock                             | No permite agregar más que el stock disponible     | Aprobado |
| 11  | Cancelar pedido                           | El carrito queda vacío                             | Aprobado |
| 12  | Volver al inicio desde carrito            | Retorna a pantalla inicial                         | Aprobado |

---

## 5. Pruebas responsive del kiosko

| N.º | Prueba                             | Resultado esperado                                          | Estado   |
| --- | ---------------------------------- | ----------------------------------------------------------- | -------- |
| 1   | Abrir en vista horizontal          | Catálogo a la izquierda y carrito a la derecha              | Aprobado |
| 2   | Abrir en vista vertical            | Catálogo ocupa pantalla y carrito aparece en barra inferior | Aprobado |
| 3   | Presionar “Ver pedido” en vertical | Se abre modal inferior del carrito                          | Aprobado |
| 4   | Cerrar modal del carrito           | Retorna al catálogo sin perder productos                    | Aprobado |
| 5   | Navegar por categorías en vertical | Las categorías siguen siendo accesibles                     | Aprobado |
| 6   | Confirmar pedido desde vertical    | Pedido se procesa correctamente                             | Aprobado |

---

## 6. Pruebas de métodos de pago

| N.º | Prueba                   | Resultado esperado                             | Estado   |
| --- | ------------------------ | ---------------------------------------------- | -------- |
| 1   | Seleccionar Yape         | Se muestra logo Yape y método seleccionado     | Aprobado |
| 2   | Seleccionar Plin         | Se muestra logo Plin y método seleccionado     | Aprobado |
| 3   | Seleccionar Tarjeta      | Se muestra ícono de tarjeta                    | Aprobado |
| 4   | Seleccionar QR           | Se muestra QR de pago                          | Aprobado |
| 5   | Confirmar pago           | Se crea pedido y pago simulado                 | Aprobado |
| 6   | Ver total antes de pagar | El monto corresponde a los productos agregados | Aprobado |

---

## 7. Pruebas de confirmación de pedido

| N.º | Prueba                             | Resultado esperado                | Estado   |
| --- | ---------------------------------- | --------------------------------- | -------- |
| 1   | Confirmar pedido con carrito vacío | El sistema no permite pagar       | Aprobado |
| 2   | Confirmar pedido con productos     | Se registra el pedido             | Aprobado |
| 3   | Procesar pago simulado             | El pedido queda con estado pagado | Aprobado |
| 4   | Mostrar número de pedido           | Se genera código tipo `KIO-0001`  | Aprobado |
| 5   | Presionar “Ver comprobante”        | Redirige a la pantalla del ticket | Aprobado |
| 6   | Presionar “Realizar otro pedido”   | Reinicia el flujo del kiosko      | Aprobado |

---

## 8. Pruebas de ticket / comprobante

Ruta evaluada:

```text
/ticket/:orderNumber
```

| N.º | Prueba                       | Resultado esperado                               | Estado   |
| --- | ---------------------------- | ------------------------------------------------ | -------- |
| 1   | Abrir ticket válido          | Se muestra comprobante del pedido                | Aprobado |
| 2   | Ver logo USIL                | El logo institucional carga correctamente        | Aprobado |
| 3   | Ver número de pedido         | Coincide con el pedido generado                  | Aprobado |
| 4   | Ver fecha y hora             | Se muestran datos del pedido                     | Aprobado |
| 5   | Ver método de pago           | Se muestra Yape, Plin, QR o Tarjeta              | Aprobado |
| 6   | Ver detalle del pedido       | Productos, cantidades y subtotales son correctos | Aprobado |
| 7   | Ver total pagado             | El total coincide con el carrito                 | Aprobado |
| 8   | Imprimir ticket              | Se abre vista de impresión                       | Aprobado |
| 9   | Ocultar botones al imprimir  | Los botones no aparecen en impresión             | Aprobado |
| 10  | Retorno automático al kiosko | La pantalla vuelve al inicio tras unos segundos  | Aprobado |

---

## 9. Pruebas de pantalla pública de retiro

Ruta evaluada:

```text
/pantalla-pedidos
```

| N.º | Prueba                             | Resultado esperado                               | Estado   |
| --- | ---------------------------------- | ------------------------------------------------ | -------- |
| 1   | Abrir pantalla de retiro           | Se muestra interfaz con logo USIL                | Aprobado |
| 2   | Ver pedidos en preparación         | Aparecen pedidos pagados o preparando            | Aprobado |
| 3   | Ver pedidos listos                 | Aparecen pedidos marcados como listos            | Aprobado |
| 4   | Ver contadores                     | Cantidades de preparación y listos son correctas | Aprobado |
| 5   | Actualización automática           | La pantalla se actualiza cada pocos segundos     | Aprobado |
| 6   | Cambiar pedido a listo desde panel | Aparece en la columna de listos                  | Aprobado |
| 7   | Marcar pedido entregado            | Desaparece de listos para recoger                | Aprobado |

---

## 10. Pruebas de login

Ruta evaluada:

```text
/login
```

| N.º | Prueba                                    | Resultado esperado                              | Estado   |
| --- | ----------------------------------------- | ----------------------------------------------- | -------- |
| 1   | Abrir login                               | Se muestra pantalla con logo USIL               | Aprobado |
| 2   | Login ADMIN                               | Redirige a panel administrativo                 | Aprobado |
| 3   | Login CAFETERIA                           | Redirige a panel de pedidos                     | Aprobado |
| 4   | Login COCINA                              | Redirige a panel de pedidos                     | Aprobado |
| 5   | Ingresar credenciales inválidas           | Muestra mensaje de error                        | Aprobado |
| 6   | Cerrar sesión                             | Limpia sesión y vuelve al login                 | Aprobado |
| 7   | Cambiar cuenta desde acceso no autorizado | Limpia sesión y permite iniciar con otra cuenta | Aprobado |

---

## 11. Pruebas de roles y permisos

| N.º | Usuario   | Ruta               | Resultado esperado           | Estado   |
| --- | --------- | ------------------ | ---------------------------- | -------- |
| 1   | ADMIN     | `/admin`           | Accede correctamente         | Aprobado |
| 2   | ADMIN     | `/admin/usuarios`  | Accede correctamente         | Aprobado |
| 3   | ADMIN     | `/admin/productos` | Accede correctamente         | Aprobado |
| 4   | ADMIN     | `/admin/reportes`  | Accede correctamente         | Aprobado |
| 5   | CAFETERIA | `/admin/pedidos`   | Accede correctamente         | Aprobado |
| 6   | CAFETERIA | `/admin/productos` | Accede correctamente         | Aprobado |
| 7   | CAFETERIA | `/admin/reportes`  | Accede correctamente         | Aprobado |
| 8   | CAFETERIA | `/admin/usuarios`  | Muestra acceso no autorizado | Aprobado |
| 9   | COCINA    | `/admin/pedidos`   | Accede correctamente         | Aprobado |
| 10  | COCINA    | `/admin/productos` | Muestra acceso no autorizado | Aprobado |
| 11  | COCINA    | `/admin/reportes`  | Muestra acceso no autorizado | Aprobado |
| 12  | COCINA    | `/admin/usuarios`  | Muestra acceso no autorizado | Aprobado |

---

## 12. Pruebas del panel de pedidos

Ruta evaluada:

```text
/admin/pedidos
```

| N.º | Prueba                      | Resultado esperado                            | Estado   |
| --- | --------------------------- | --------------------------------------------- | -------- |
| 1   | Ver pedidos pagados         | Se muestran pedidos listos para preparar      | Aprobado |
| 2   | Marcar como preparando      | Pedido pasa a columna “En preparación”        | Aprobado |
| 3   | Marcar como listo           | Pedido pasa a columna “Listos”                | Aprobado |
| 4   | Marcar como entregado       | Pedido pasa a columna “Entregados”            | Aprobado |
| 5   | Ver totales del panel       | Métricas se actualizan correctamente          | Aprobado |
| 6   | Actualizar panel            | Recarga pedidos desde backend                 | Aprobado |
| 7   | Restringir acciones por rol | Cocina no entrega pedidos si no tiene permiso | Aprobado |

---

## 13. Pruebas de gestión de productos

Ruta evaluada:

```text
/admin/productos
```

| N.º | Prueba                       | Resultado esperado                                 | Estado   |
| --- | ---------------------------- | -------------------------------------------------- | -------- |
| 1   | Ver catálogo registrado      | Se listan productos existentes                     | Aprobado |
| 2   | Ver imágenes reales en lista | Se muestran imágenes, no solo emojis               | Aprobado |
| 3   | Ver vista previa de imagen   | La imagen cambia según selección                   | Aprobado |
| 4   | Crear producto               | Producto se guarda en base de datos                | Aprobado |
| 5   | Editar producto              | Datos se actualizan correctamente                  | Aprobado |
| 6   | Actualizar stock             | Stock cambia correctamente                         | Aprobado |
| 7   | Desactivar producto          | Producto deja de estar activo                      | Aprobado |
| 8   | Activar producto             | Producto vuelve a estar disponible                 | Aprobado |
| 9   | Eliminar producto con ADMIN  | Producto se elimina si está permitido              | Aprobado |
| 10  | Filtrar por categoría        | Se muestran productos de la categoría seleccionada | Aprobado |
| 11  | Filtrar por estado           | Se muestran activos o inactivos                    | Aprobado |
| 12  | Validar formulario           | No permite guardar datos incompletos               | Aprobado |
| 13  | Diseño del formulario        | Los campos quedan correctamente alineados          | Aprobado |

---

## 14. Pruebas de reportes

Ruta evaluada:

```text
/admin/reportes
```

| N.º | Prueba                        | Resultado esperado                            | Estado   |
| --- | ----------------------------- | --------------------------------------------- | -------- |
| 1   | Ver resumen gerencial         | Se muestran métricas principales              | Aprobado |
| 2   | Ver ventas totales            | Monto calculado correctamente                 | Aprobado |
| 3   | Ver pedidos totales           | Cantidad calculada correctamente              | Aprobado |
| 4   | Ver ticket promedio           | Promedio calculado correctamente              | Aprobado |
| 5   | Ver productos vendidos        | Total de unidades vendidas correcto           | Aprobado |
| 6   | Ver ranking de productos      | Muestra productos más vendidos                | Aprobado |
| 7   | Ver ventas por método de pago | Se agrupan ventas por Yape, QR, tarjeta, etc. | Aprobado |
| 8   | Ver pedidos por estado        | Se agrupan pedidos por estado                 | Aprobado |
| 9   | Ver ventas por día            | Se visualiza evolución diaria                 | Aprobado |
| 10  | Aplicar filtro de fechas      | Reportes se recalculan según periodo          | Aprobado |

---

## 15. Pruebas de gestión de usuarios

Ruta evaluada:

```text
/admin/usuarios
```

| N.º | Prueba                      | Resultado esperado                | Estado   |
| --- | --------------------------- | --------------------------------- | -------- |
| 1   | Ver usuarios registrados    | Se listan usuarios existentes     | Aprobado |
| 2   | Crear usuario               | Usuario se registra correctamente | Aprobado |
| 3   | Editar usuario              | Datos se actualizan correctamente | Aprobado |
| 4   | Cambiar rol                 | Rol se actualiza correctamente    | Aprobado |
| 5   | Activar usuario             | Usuario queda habilitado          | Aprobado |
| 6   | Desactivar usuario          | Usuario queda inhabilitado        | Aprobado |
| 7   | Filtrar por rol             | Lista se filtra correctamente     | Aprobado |
| 8   | Filtrar por estado          | Lista se filtra correctamente     | Aprobado |
| 9   | Buscar usuario              | Busca por nombre o correo         | Aprobado |
| 10  | Proteger ruta para no ADMIN | Muestra acceso no autorizado      | Aprobado |
| 11  | Ver sesión actual           | Muestra usuario autenticado       | Aprobado |

---

## 16. Pruebas de backend con curl

### Health check

```bash
curl http://localhost:4000/api/health
```

Resultado esperado:

```text
Backend activo y funcionando correctamente.
```

Estado: Aprobado.

### Productos

```bash
curl http://localhost:4000/api/products
```

Resultado esperado:

```text
Listado de productos activos.
```

Estado: Aprobado.

### Login administrador

```bash
curl -X POST http://localhost:4000/api/auth/login \
-H "Content-Type: application/json" \
--data '{"email":"admin@usil.edu.pe","password":"Admin123"}'
```

Resultado esperado:

```text
Token JWT y datos del usuario administrador.
```

Estado: Aprobado.

### Ticket público

```bash
curl http://localhost:4000/api/orders/public/ticket/KIO-0001
```

Resultado esperado:

```text
Detalle público del pedido.
```

Estado: Aprobado.

---

## 17. Observaciones encontradas y corregidas

| N.º | Observación                                       | Corrección aplicada                                   | Estado    |
| --- | ------------------------------------------------- | ----------------------------------------------------- | --------- |
| 1   | El carrito en vertical ocupaba demasiado espacio  | Se implementó barra inferior y modal                  | Corregido |
| 2   | Faltaban imágenes oficiales                       | Se integraron logos USIL, Yape, Plin y QR             | Corregido |
| 3   | El ticket podía imprimir botones                  | Se aplicaron estilos `@media print`                   | Corregido |
| 4   | La pantalla de productos mostraba emojis          | Se integraron imágenes reales en gestión de productos | Corregido |
| 5   | El formulario de productos se salía de la tarjeta | Se corrigió `boxSizing`, ancho y layout               | Corregido |
| 6   | Acceso no autorizado redirigía a sesión anterior  | Se agregó limpieza de sesión para cambio de cuenta    | Corregido |

---

## 18. Resultado general

El sistema cumple con los flujos principales planteados para una demo funcional:

```text
Kiosko público: Aprobado
Flujo de pedido: Aprobado
Pago simulado: Aprobado
Ticket/comprobante: Aprobado
Pantalla de retiro: Aprobado
Panel de pedidos: Aprobado
Gestión de productos: Aprobado
Reportes gerenciales: Aprobado
Gestión de usuarios: Aprobado
Roles y permisos: Aprobado
Branding institucional: Aprobado
```

---

## 19. Conclusión de pruebas

Luego de ejecutar las pruebas funcionales, visuales y de permisos, se concluye que el sistema se encuentra en estado **completo y funcional para presentación o demostración académica/profesional**.

El sistema permite simular de forma integral el proceso de autoservicio en una cafetería universitaria, desde la selección de productos hasta la gestión interna de pedidos y reportes administrativos.

---

## 20. Estado final

```text
Estado del sistema: COMPLETO
Resultado de pruebas: APROBADO
Versión evaluada: Demo funcional
Proyecto listo para: presentación, documentación y exposición
```

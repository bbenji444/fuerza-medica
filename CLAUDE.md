# Fuerza Médica — Contexto del Proyecto

## ¿Qué es este proyecto?
Sistema de administración + página web pública para **Fuerza Médica**, una tienda de equipo médico y ortopédico con 3 sucursales en México (Coacalco, Tultepec, Sucursal X). Desarrollado por **OVITECH AI & Digital Solutions** (www.ovitech.io).

## Stack tecnológico
- **Frontend/Backend:** Next.js 16 con App Router, TypeScript, Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL) con Row Level Security (RLS)
- **Autenticación:** Supabase Auth
- **PDFs:** jsPDF + jspdf-autotable (cotizaciones, tickets de venta, reporte de stock bajo)
- **Gráficas:** recharts (dashboard)
- **Deployment:** Vercel, conectado a GitHub (`github.com/bbenji444/fuerza-medica`, rama `master`) — push a `master` dispara el deploy. Los cambios de código solo se ven en el sitio en vivo después de `git push`; editar los archivos localmente no publica nada por sí solo.

## Estructura del proyecto
```
src/
├── app/
│   ├── admin/                    ← Panel de administración (requiere auth)
│   │   ├── layout.tsx            ← Layout con Sidebar para todas las páginas admin
│   │   ├── page.tsx              ← Dashboard gerencial (KPIs + gráficas)
│   │   ├── DashboardCharts.tsx   ← Gráficas del dashboard (client component, recharts)
│   │   ├── Sidebar.tsx           ← Navegación lateral + cerrar sesión + logo
│   │   ├── EdicionLoteModal.tsx  ← Modal genérico de edición en lote (fijar/%/monto + vista previa)
│   │   ├── inventario/            ← Fusiona Productos + Inventario (ya no existe /admin/productos)
│   │   │   ├── page.tsx          ← Productos+stock por sucursal (server component)
│   │   │   └── InventarioTable.tsx ← Tabla con precios+existencias, filtros, stock bajo, PDF/Excel, edición en lote
│   │   ├── cotizaciones/
│   │   │   ├── page.tsx          ← Lista de cotizaciones (server component)
│   │   │   ├── CotizacionesTable.tsx ← Lista, exportar PDF, borrar, convertir en venta
│   │   │   └── NuevaCotizacionModal.tsx ← Crear/editar cotización (cliente, productos, descuentos)
│   │   ├── ventas/
│   │   │   ├── page.tsx          ← Lista de ventas + cortes de caja (server component)
│   │   │   ├── VentasTable.tsx   ← Panel de venta rápida siempre visible + botones "Historial" y "Cortes de caja" que ocultan/muestran sus listados
│   │   │   ├── VentaRapidaPanel.tsx ← Panel inline (NO modal): sin pasos, cliente opcional/colapsado, escaneo de código de barras, valida y descuenta stock, control de caja (abrir/cerrar) y pagos mixtos
│   │   │   └── CortesCajaTable.tsx ← Historial de cortes de caja (fondo inicial, efectivo esperado/contado, diferencia, quién abrió/cerró)
│   │   ├── reportes/
│   │   │   ├── page.tsx          ← Desglose de ventas (server component, solo admin_general)
│   │   │   └── ReportesView.tsx  ← Selector Hoy/Semana/Mes o rango de fechas, tabla por producto+fecha, PDF
│   │   ├── promociones/
│   │   │   ├── page.tsx          ← Lista de promociones (server component, solo admin_general)
│   │   │   └── PromocionesTable.tsx ← CRUD de descuentos por producto o categoría
│   │   ├── empleados/
│   │   │   ├── page.tsx          ← Lista de empleados (server component, solo admin_general)
│   │   │   └── EmpleadosTable.tsx ← CRUD de accesos (llama a /api/empleados)
│   │   ├── destacados/
│   │   │   ├── page.tsx          ← Lista de productos_destacados (server component, solo admin_general)
│   │   │   └── DestacadosTable.tsx ← Buscar producto + agregar/quitar/reordenar la curaduría de "Más vendidos"
│   │   └── variantes/
│   │       ├── page.tsx          ← Lista de productos agrupados por variante_grupo_id (server component, solo admin_general)
│   │       └── VariantesManager.tsx ← Crear/editar/desagrupar variantes de tamaño/color (etiqueta + orden por producto)
│   ├── api/
│   │   └── empleados/
│   │       ├── route.ts          ← POST: crea usuario en Supabase Auth + fila en `usuarios`
│   │       └── [id]/route.ts     ← PATCH: editar datos, activar/desactivar, resetear contraseña
│   ├── login/
│   │   └── page.tsx              ← Pantalla de login (con logo). Input de correo con `autoComplete="username"` (el navegador sugiere/autocompleta correos ya usados); contraseña con `autoComplete="current-password"` (se captura normal, sin sugerencias de texto libre)
│   ├── components/                ← Compartidos por la página pública (NO el admin, que usa estilos en línea)
│   │   ├── SiteHeader.tsx        ← Header público (logo, nav, menú hamburguesa en móvil, ícono de carrito con contador) — client component
│   │   ├── SiteFooter.tsx        ← Footer público (sucursales + navegación) — recibe `sucursales` como prop
│   │   ├── CartContext.tsx       ← Context + localStorage del carrito de compra (`useCart()`), envuelve toda la app desde `layout.tsx`
│   │   ├── CartDrawer.tsx        ← Panel lateral del carrito (cantidades, quitar, total) + botón "Comprar por WhatsApp"
│   │   ├── MasVendidosSection.tsx ← Grid de `productos_destacados` en la landing (client, usa useCart)
│   │   ├── MarcasCarousel.tsx    ← Carrusel infinito de logos de marca (CSS puro, sin JS de animación)
│   │   ├── ProductoImagen.tsx    ← `<Image>` con swap a `imagen_url_hover` al pasar el mouse (catálogo, destacados, producto, similares)
│   │   ├── WhatsAppFloatingButton.tsx ← Botón flotante (abajo a la derecha) en todas las páginas públicas
│   │   ├── SocialIcons.tsx       ← Iconos SVG compartidos (WhatsApp, Facebook, Instagram, teléfono, búsqueda, menú, chevron)
│   │   └── sucursalesInfo.ts     ← `infoMapaSucursales` (CID de Google Maps por sucursal) + `ordenarSucursales()`
│   ├── page.tsx                  ← Landing pública: hero con video (h-screen junto al header), valores, **Los más vendidos**, **Nuestras Marcas**, **Sucursales** (con mapas), CTA
│   ├── catalogo/
│   │   ├── page.tsx              ← Server component: fetch productos/categorias/sucursales (rol anon)
│   │   ├── CatalogoClient.tsx    ← Búsqueda + mega-menú de categorías + scroll infinito (IntersectionObserver) + colapsa variantes de tamaño/color en una sola tarjeta
│   │   └── CategoriasMegaMenu.tsx ← Flyout de 2 columnas (categoría → subcategorías) en escritorio, acordeón en móvil
│   └── producto/[id]/
│       ├── page.tsx              ← Server component: producto + categoría + disponibilidad por sucursal (RPC) + variantes hermanas + similares
│       └── ProductoDetalleClient.tsx ← Imagen con hover, selector de variantes, cantidad, agregar al carrito, descripción, especificaciones, similares
└── utils/
    ├── supabase/
    │   ├── client.ts             ← Cliente Supabase para el navegador
    │   ├── server.ts             ← Cliente Supabase para el servidor (cookies, respeta RLS, fuerza `cache: 'no-store'` en fetch — ver Notas)
    │   ├── admin.ts              ← SOLO server-side: cliente con service role + requerirAdmin()
    │   └── usuarioActual.ts      ← obtenerUsuarioActual() memoizado con React.cache() (evita repetir auth+usuarios)
    ├── fetchTodasLasFilas.ts     ← Pagina automáticamente consultas que puedan superar 2000 filas
    ├── aplicarEdicionLote.ts     ← UPDATE en lote por lotes de 100 ids / 50 peticiones concurrentes (ver Notas)
    ├── descontarInventarioCarrito.ts ← Descuenta/restituye stock vía RPC atómico, con rollback
    ├── promociones.ts            ← Calcula precio con descuento según promociones vigentes
    ├── logoPdf.ts                ← Descarga y cachea el logo en base64 para los PDFs (fetch en cliente)
    ├── generarPdfCotizacion.ts
    ├── generarPdfTicket.ts       ← Ticket de venta (formato angosto 80mm)
    ├── generarPdfStockBajo.ts
    ├── generarPdfReporteVentas.ts
    └── generarExcelInventario.ts ← Exporta a .xlsx con la librería xlsx (stock bajo / inventario completo)
middleware.ts                     ← Protege rutas /admin, redirige a /login si no hay sesión
```

## Base de datos — Tablas en Supabase

### Tablas principales
- **sucursales** — 3 sucursales (Coacalco, Tultepec, Sucursal X)
- **categorias** — 12 categorías principales + subcategorías (campo `categoria_padre` uuid FK a categorias.id)
- **productos** — 1,376 productos con codigo, nombre, precio_costo, precio_venta, precio_mayoreo, categoria_id, activo, **imagen_url** (nullable, se llena desde `/admin/inventario`; si vacío en público se muestra el logo de Fuerza Médica como placeholder, no un emoji), **imagen_url_hover** (nullable, segunda imagen al pasar el mouse), **descripcion** (nullable, página pública de producto), **variante_grupo_id / variante_nombre / variante_orden** (agrupan tamaño/color, ver "Variantes de producto")
- **productos_destacados** — curaduría manual de "Los más vendidos" en la landing (producto_id FK único, posicion). Gestionada desde `/admin/destacados`. NO refleja ventas reales.
- **inventario** — Stock por sucursal (producto_id + sucursal_id + existencia + inventario_minimo + inventario_maximo). Las 3 sucursales tienen el mismo listado de productos replicado (pendiente que el usuario lo ajuste sucursal por sucursal)
- **usuarios** — admin_general + operadores por sucursal. `rol`: 'admin_general' o 'operador'. `id` = mismo uuid que `auth.users.id` (sin default, se asigna al crear el usuario de Auth). Se crean desde `/admin/empleados` vía API route con service role
- **clientes** — Datos de clientes para cotizaciones/ventas (nombre, telefono, correo, direccion)
- **cotizaciones** — Cabecera (cliente_id, sucursal_id, usuario_id, estado, total). **`estado` CHECK constraint**: solo `'borrador'`, `'enviada'`, `'aceptada'`, `'cancelada'` (⚠️ NO `'rechazada'`, falla con error 23514)
- **cotizacion_items** — Detalle por cotización (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal generado)
- **ventas** — Cabecera (folio autogenerado `V-0001` vía secuencia, sucursal_id, usuario_id, cliente_id nullable, metodo_pago: `'efectivo'|'tarjeta'|'transferencia'|'mixto'`, total, cotizacion_id nullable si vino de conversión). **Pagos mixtos**: `monto_efectivo/monto_tarjeta/monto_transferencia` (deben sumar `total`; si más de uno es > 0, `metodo_pago = 'mixto'`), `monto_recibido_efectivo` (lo que entregó el cliente en efectivo) y `cambio` (recibido - monto_efectivo) para saber cuánto regresar. `corte_caja_id` FK a `cortes_caja` (a qué turno de caja pertenece).
- **venta_items** — Detalle por venta (venta_id, producto_id, cantidad, precio_unitario, subtotal generado)
- **cortes_caja** — Control de caja/cambio por sucursal (`/admin/ventas`, panel "Venta rápida"). Un renglón por apertura de caja: `fondo_inicial` (efectivo físico capturado al abrir), `estado` (`'abierto'|'cerrado'`, único **abierto** por sucursal vía índice parcial), `usuario_apertura_id`/`usuario_cierre_id`. Al cerrar: `efectivo_esperado` (snapshot de `fondo_inicial + Σ monto_efectivo` de las ventas de ese corte, calculado en el momento del cierre), `efectivo_contado` (conteo físico que captura el empleado) y `diferencia` (contado − esperado, sobrante/faltante). "Efectivo en caja ahora" en el panel de Ventas se recalcula sumando `monto_efectivo` de las ventas del corte abierto — no requiere corte activo para vender por tarjeta/transferencia, pero **el panel bloquea "Registrar venta" si no hay caja abierta**, sin importar el método (simplifica el modelo mental: un turno de caja cubre todas las ventas, igual que un POS normal).
- **promociones** — Descuentos por producto o categoría (tipo: porcentaje/precio_fijo/precio_especial, valor, producto_id o categoria_id, activa, fecha_inicio/fecha_fin opcionales)
- **solicitudes_web** — Tabla histórica, ya no se usa: el formulario público "Solicitar producto" y `/admin/solicitudes` se quitaron (todo contacto va por WhatsApp)
- **configuracion** — Una sola fila con `margen_ganancia` (default 70) e `iva_porcentaje` (default 16), usada por la Calculadora de precio en Ventas

### Funciones SQL (RPC y helpers de RLS)
- **descontar_inventario(p_producto_id, p_sucursal_id, p_cantidad)** — UPDATE atómico condicional (`WHERE existencia >= p_cantidad`). Si no hay stock suficiente, **no actualiza nada y devuelve una fila con todos los campos en `null`** (revisar `data.id == null`, no `!data`). Usado al crear ventas y al convertir cotizaciones. `security definer` con chequeo explícito `es_admin() or p_sucursal_id = mi_sucursal()` (no depende de RLS de `inventario`, que solo permite UPDATE a admin).
- **incrementar_inventario(...)** — mismo patrón, para devolver stock (rollback de ventas fallidas o al borrar una venta).
- **es_admin()** — `security definer`, true si `auth.uid()` tiene `rol = 'admin_general'` en `usuarios`. Usado en políticas RLS.
- **mi_sucursal()** — `security definer`, devuelve el `sucursal_id` del usuario autenticado.
- **disponibilidad_producto_otras_sucursales(p_producto_id, p_sucursal_actual)** — `(sucursal_nombre, existencia)` de un producto en las DEMÁS sucursales. `security definer` intencional: abre una rendija controlada (solo ese producto, nombre+existencia, nunca precios) sin exponer el inventario completo. Usada en `VentaRapidaPanel` cuando un renglón tiene `existencia === 0` o `cantidad > existencia`.
- **disponibilidad_producto_publica(p_producto_id)** — mismo patrón para `anon` (página pública de producto): `(sucursal_nombre, existencia)` de TODAS las sucursales activas para un producto. `inventario` no tiene política `anon`; esta función es la única rendija.
- ⚠️ **Gotcha**: cualquier RPC que haga UPDATE/DELETE que un operador no podría hacer directamente vía RLS **debe ser `security definer`** y validar el permiso ella misma (`es_admin()`/`mi_sucursal()`) — si es `security invoker` (default), RLS la bloquea en silencio (causó que operadores no pudieran vender: la función devolvía fila `null` sin error visible). Pensar esto antes de agregar cualquier RPC sobre tablas restringidas a admin.

### Políticas RLS activas
La mayoría son para `authenticated` (panel admin). Las marcadas `anon` son para la página pública (sin login) — DISTINTAS y ADICIONALES, no reemplazan a las de `authenticated`.
- **productos**: SELECT abierto (`authenticated`); INSERT/UPDATE/DELETE solo `es_admin()`. **Para `anon`**: SELECT solo `activo = true` + **column-level grant restringido** (`id, codigo, nombre, precio_venta, categoria_id, imagen_url, activo, creado_en, imagen_url_hover, descripcion, variante_grupo_id, variante_nombre, variante_orden`) — `anon` JAMÁS lee `precio_costo`/`precio_mayoreo`. ⚠️ Cualquier columna sensible nueva en `productos` necesita revisar/actualizar este grant (Supabase por default da SELECT de toda la tabla a `anon`).
- **inventario**: SELECT solo `es_admin() or sucursal_id = mi_sucursal()`; INSERT/UPDATE/DELETE solo `es_admin()`. Sin política `anon` (única rendija: `disponibilidad_producto_publica`).
- **sucursales, categorias**: SELECT abierto para `authenticated` y `anon` (`categorias` sin filtro; `sucursales` solo `activa = true`).
- **solicitudes_web**: políticas siguen existiendo pero ya no se usan (módulo quitado).
- **productos_destacados**: SELECT para `authenticated` y `anon` (mismo column-level grant restringido que productos); INSERT/UPDATE/DELETE solo `es_admin()`.
- **clientes**: SELECT/INSERT/UPDATE/DELETE abiertos (sin scoping por sucursal).
- **usuarios**: SELECT solo `auth.uid() = id or es_admin()`. Sin políticas de INSERT/UPDATE (solo vía API routes con service role).
- **cotizaciones, ventas**: SELECT/INSERT/UPDATE(solo cotizaciones)/DELETE scoped a `es_admin() or sucursal_id = mi_sucursal()`.
- **cortes_caja**: mismo patrón (`es_admin() or sucursal_id = mi_sucursal()`) para SELECT/INSERT/UPDATE; DELETE solo `es_admin()` (por si se abre uno por error).
- **cotizacion_items, venta_items**: heredan el alcance de su cabecera vía `exists(...)`.
- **promociones**: SELECT abierto; INSERT/UPDATE/DELETE solo `es_admin()`.
- **configuracion**: SELECT abierto; UPDATE solo `es_admin()`.
- ⚠️ **Gotcha**: "SELECT abierto" en este proyecto históricamente significaba "abierto para `authenticated`", NO público — un visitante sin sesión (`anon`) obtiene `[]` de cualquier tabla sin política `anon` explícita. Confirmado con prueba real antes de construir la página pública. Cualquier tabla nueva que la página pública necesite leer requiere su propia política `to anon`.
- Historial de políticas ya aplicadas: archivos `add-*.sql` en la raíz del repo (registro, no volver a correr).

### Storage (Supabase Storage)
- **Bucket `productos`** (público) — imágenes de producto, ruta `{producto_id}.{extensión}` con `upsert: true` (re-subir reemplaza el archivo). Políticas: INSERT/UPDATE/DELETE solo `authenticated` + `es_admin()`; SELECT público (`to public`).
- La URL guardada en `productos.imagen_url` lleva `?t=timestamp` para evitar caché del navegador tras reemplazar imagen.

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ujknambmwsomjungybvf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...  ← Solo para scripts de migración, NUNCA en el frontend
```

## Patrones de código establecidos

### Server components (page.tsx)
- Verifican sesión con `obtenerUsuarioActual()` (`@/utils/supabase/usuarioActual`) — si no hay `user`, redirigen a `/login`; si es admin-only y `usuario.rol !== 'admin_general'`, redirigen a `/admin/cotizaciones`. No volver a escribir `auth.getUser()` + select de `usuarios` a mano (layout.tsx ya lo llama).
- El resto de las queries independientes van en un solo `Promise.all([...])`, nunca `await` sueltos uno tras otro.
- Traen datos de Supabase y los pasan como props al componente interactivo, usando `@/utils/supabase/server`.
- Si una consulta puede superar 2000 filas, usar `fetchTodasLasFilas()` en vez de `.range()` directo — 2000 es tope duro del servidor.

### Client components (Tabla*.tsx / *Modal.tsx)
- Siempre `'use client'`, manejan estado local, usan `@/utils/supabase/client`.
- Después de guardar cambios usan `router.refresh()`.
- Modales con varios pasos (cotización, venta) usan un `useRef` (`guardandoRef`) además del estado `guardando` para bloquear doble-submit síncronamente (React no re-renderiza a tiempo entre dos clicks rápidos).
- Items de carrito usan un `id` generado en cliente (`crypto.randomUUID()`) como key — nunca `producto_id` (puede repetirse si hay más de un renglón del mismo producto).

### Estilo visual
- Colores principales: Navy `#0D1B3E`, Azul `#1A6DD4`, Fondo `#F4F8FF`
- Colores de estado: verde `#1A7A3E`/`#E8F7EE` (positivo/vigente), azul `#1A6DD4`/`#E3EEFD` (enviada/programada), rojo `#B81C1C`/`#FDE8E8` (negativo/expirado/stock bajo), gris `#888`/`#F0F4FB` (neutral/inactivo)
- Admin: sin Tailwind, estilos en línea. Página pública: Tailwind.
- Sidebar oscuro (`#0D1B3E`) con logo (`/logo fuerza medica.jpg`, fondo blanco redondeado, centrado), contenido en fondo claro (`#F4F8FF`)
- Todos los inputs/selects deben tener `color: #1A1A1A` — ya definido en globals.css

## Control de acceso por rol (admin_general vs operador)
- **admin_general**: ve y administra todo (Dashboard, Inventario de las 3 sucursales con precios, Cotizaciones/Ventas de todas las sucursales, Reportes, Promociones, Empleados).
- **operador**: Sidebar solo Inventario/Cotizaciones/Ventas. No entra a `/admin`, `/admin/reportes`, `/admin/promociones` ni `/admin/empleados` (redirigen a `/admin/cotizaciones`). Solo ve/opera su propia sucursal (`usuarios.sucursal_id`) — otras sucursales ni se devuelven por RLS. En Inventario: solo lectura (incluyendo precios), sin checkboxes ni edición en lote.
- Reforzado en UI (props `esAdmin`/`rol`) y en RLS (`es_admin()`/`mi_sucursal()`) — un operador no puede saltárselo llamando a la API directamente.

## Rendimiento
Latencia base a Supabase desde este entorno: ~220-330ms **por request** — cada llamada secuencial de más se siente.
- **Paralelizar todo lo independiente** en cada `page.tsx` con `Promise.all([...])`, nunca `await` uno tras otro.
- **`obtenerUsuarioActual()`** (envuelto en `React.cache()`) reemplaza llamadas repetidas a `auth.getUser()` + select de `usuarios` — todo `page.tsx` nuevo debe usarlo, no reescribir el check manual.
- **`fetchTodasLasFilas`** usa lotes de 2000 (tope real del servidor) — lotes más chicos solo multiplican viajes de red.
- Librerías pesadas (jsPDF, xlsx, recharts) ya están bien separadas por ruta por el bundler de Next (verificado). No asumir que son la causa si algo se siente lento; medir antes de optimizar.
- **Pendiente de evaluar** (preguntar antes, es cambio de arquitectura): Cotizaciones/Ventas cargan catálogo+inventario+promociones en cada visita a la LISTA, aunque solo se necesita al abrir el modal de "Nueva cotización/venta". Diferir ese fetch al abrir el modal reduciría el costo de ver la lista, a cambio de un spinner al crear.
- Opción de bajo esfuerzo: subir el límite de filas de Supabase (Dashboard → API settings) por encima de 2000.

## Módulos construidos hasta ahora

### Empleados (`/admin/empleados`, solo admin_general)
Alta crea el usuario en Supabase Auth (`auth.admin.createUser` con service role, en `/api/empleados`) y su fila en `usuarios` en la misma operación. Editar datos, resetear contraseña, activar/desactivar acceso (desactivar usa `ban_duration` de Auth + `activo=false`). Nunca se borra el usuario (conserva historial). Si tiene sesión activa, el bloqueo tarda hasta que su token expire.

### Inventario (`/admin/inventario`) — fusiona Productos + Inventario
Una sola tabla por sucursal con código/nombre/categoría/precios (`productos`) + existencia/mínimo/máximo (`inventario`), un solo `select` con `productos(...)` embebido. Cada fila carga `producto_id` e `inventario_id`; `EdicionLoteModal` sabe por campo a qué tabla escribir (precios/categoría → productos; existencia/mínimo/máximo → inventario). "Editar" individual hace los dos UPDATE en el mismo submit.
"Stock bajo" = `existencia <= inventario_maximo / 3` (no usa `inventario_minimo`). Contador + reporte PDF/Excel. **"+ Agregar producto"** crea producto + fila de inventario en las 3 sucursales (existencia inicial solo en la sucursal activa). **"Borrar"** verifica que no tenga cotizaciones/ventas/promociones asociadas antes de borrar `inventario`+`productos`. Edición/alta/baja solo admin_general. No existe campo "activo" en la UI (retirar = borrar). **"+ Imagen"**: sube a Storage (bucket `productos`, `{producto_id}.{ext}`, `upsert:true`), guarda URL con `?t=timestamp` en `productos.imagen_url`. "Quitar" limpia el campo (no borra el archivo).

### Cotizaciones (`/admin/cotizaciones`)
Crear/editar: cliente (buscar/crear/editar/borrar inline) + productos (stock en tiempo real, precio con descuento si hay promoción vigente) + total automático. Exportar PDF, borrar, cambiar estado, "Convertir en venta" (solo si `estado = 'aceptada'`): pide método de pago, copia productos a venta nueva, descuenta inventario, genera ticket.

### Calculadora de precio (en Ventas, botón colapsable)
Uso interno, no toca `precio_venta`. Costo (manual o de un producto) → +Ganancia % (default 70, de `configuracion`) → Subtotal → +IVA % (default 16) → Precio final. Solo admin_general puede "Guardar como nuevo default".
También **integrada en la tabla del carrito de `VentaRapidaPanel`** (columnas "Costo" y "% Ganancia" por renglón): el % Ganancia muestra el margen que YA se aplica hoy (`margenActual()`: `(precio_sin_iva/costo - 1) * 100`, IVA % compartido editable arriba). Cambiar el % recalcula y aplica el precio al instante; "Precio" sigue editable como override manual. "Ganancia % para todos" + "Aplicar a todos" fija el mismo % en todos los renglones. Costo siempre editable (si el producto no tiene costo, $0.00 capturable ahí). Columna **"IVA"** por renglón (`subtotal - subtotal/(1+iva/100)`) + "IVA incluido: $X" junto al Total.

### Ventas (`/admin/ventas`) — optimizado para velocidad, no para historial
No es modal: `VentaRapidaPanel` siempre visible, sin pasos (cliente, sucursal/método de pago, productos en una sola pantalla). Cliente opcional y colapsado por defecto. Historial detrás de botón "Historial (N)" (antes era la vista default, iba contra el flujo rápido de cajeros). Soporte de escáner de código de barras (ver abajo). Valida y descuenta stock atómicamente — si no hay suficiente, no se crea la venta y se revierte cualquier descuento parcial. Si un renglón tiene `existencia === 0` o cantidad > stock, consulta `disponibilidad_producto_otras_sucursales` y muestra "Disponible en: X (n), Y (n)". Historial conserva "Generar ticket" y "Borrar" (restituye stock); columna "Método de pago" muestra el desglose por método en un `title` (tooltip) cuando es "mixto", y el cambio entregado debajo si aplica.

**Confirmación antes de registrar** — "Registrar venta" **no** guarda directo: llama a `abrirConfirmacionVenta()`, que corre las validaciones (carrito no vacío, sucursal, caja abierta, montos cuadrando, nombre de cliente nuevo si aplica) y si pasan abre un modal "Confirmar venta" (`mostrarConfirmarVenta`) con método de pago, total, el campo "Recibido en efectivo" editable ahí mismo (mismo estado `montoRecibidoInput` que el de la pantalla principal, así que cualquier cambio se refleja también ahí) y "Cambio a entregar" recalculado en vivo. "Cancelar" solo cierra el modal (`setMostrarConfirmarVenta(false)`), no toca la base de datos ni el carrito. Solo "Confirmar venta" corre `guardarVenta()` (el INSERT real + descuento de stock); si algo falla ahí (stock insuficiente, error de Supabase), el error se muestra dentro del mismo modal en vez de perderse, y el modal se queda abierto para reintentar o cancelar. Al confirmar con éxito, se cierra este modal y se abre uno segundo, post-venta (`mostrarResumenVenta`), con folio + resumen (Total / Recibido en efectivo / Cambio a entregar) y botones "Generar ticket" / "Aceptar" — el panel se reinicia (carrito, cliente, montos) justo antes de mostrar este segundo modal.

**Orden fijo de sucursal en los dropdowns de Ventas y Cotizaciones** — el `<select>` de sucursal en `VentaRapidaPanel` y `NuevaCotizacionModal` recibe el arreglo `sucursales` ya reordenado desde `page.tsx` (Sucursal Coacalco → Sucursal Tultepec → resto, filtrando por `nombre.toLowerCase().includes(...)`), igual que ya se hacía en el dashboard (`/admin`, ver `sucursalesOrdenadas` ahí). Así cualquier sucursal futura sin coincidencia (ej. una marcada "Próximamente") siempre cae al final en vez de aparecer primera por orden alfabético.

**Control de caja** — banner siempre visible arriba del panel (`corteAbierto`/`efectivoEnCaja` en `VentaRapidaPanel`, atado a la sucursal seleccionada). Si no hay caja abierta para esa sucursal, "Registrar venta" queda deshabilitado ("Abre la caja para vender") — se requiere abrir caja para cualquier venta, sin importar el método de pago. "Abrir caja" pide el fondo inicial (efectivo físico ya en la caja); de ahí "Efectivo en caja ahora" = `fondo_inicial + Σ monto_efectivo` de las ventas del corte, y se recalcula justo después de cada venta (no hay polling, solo se refresca en los momentos en que puede haber cambiado). "Cerrar caja" muestra el efectivo esperado (el mismo total en pantalla), pide el conteo físico y calcula sobrante/faltante antes de guardar el corte como cerrado. Botón "Cortes de caja (N)" (`CortesCajaTable.tsx`) junto a "Historial" lista los cortes pasados y su resultado — visible para todos los roles, cada quien ve solo los de su sucursal vía RLS (admin ve todas).

**Pagos mixtos** — selector de modo (Efectivo/Tarjeta/Transferencia/"Pago mixto") en vez del select único de antes. En modo mixto se capturan los tres montos y deben sumar el total exacto (tolerancia de 1 centavo) o se bloquea el guardado. Si hay componente en efectivo (en cualquier modo), aparece "Recibido en efectivo" (placeholder = monto exacto, si se deja vacío se asume pago exacto) y se calcula "Cambio a entregar" en vivo. `metodo_pago` se deriva automáticamente: si más de un monto es > 0, queda `'mixto'`.

## Escaneo de código de barras (Cotizaciones y Ventas)
Un escáner USB se comporta como teclado: escribe el código y presiona Enter. Patrón en `NuevaCotizacionModal.tsx` y `VentaRapidaPanel.tsx`:
- Input de "Buscar o escanear producto" con `ref`, se enfoca al entrar al paso de productos (o al montar en Ventas) y se re-enfoca tras cada producto agregado o venta/cotización guardada.
- `onKeyDown`: si `Enter`, busca coincidencia **exacta** (`p.codigo.toLowerCase() === texto.toLowerCase()`, no `.includes()`); si no existe, muestra "Producto no encontrado" y limpia el input igual (no bloquea el siguiente escaneo).
- `agregarProducto()` **incrementa la cantidad** si el producto ya está en el carrito (necesario para que escanear dos veces equivalga a cantidad 2).
- La búsqueda difusa mientras se escribe (sin Enter) sigue funcionando para selección manual.

### Reportes (`/admin/reportes`, solo admin_general)
Selector Hoy/Semana/Mes o rango de fechas personalizado. Dos vistas con toggle:
- **"Por venta"** (default) — tarjeta por venta (`ventas` con `venta_items(productos(...))`, `clientes(nombre)`, `sucursales(nombre)` anidados en un select), folio/fecha/cliente/método de pago/total + productos. Borde de color por sucursal (`paletaSucursales`, por orden de aparición vía `colorDe()`).
- **"Por producto"** — tabla agrupada por producto + fecha, cantidad y total; alimenta el PDF.
Comparativo por sucursal + descarga PDF. Tarjetas "Ventas de hoy/mes" del dashboard enlazan aquí con el periodo correspondiente.

### Promociones (`/admin/promociones`)
Descuentos por producto o categoría completa, tipo (%/monto fijo/precio especial) y vigencia opcional. Se aplican automáticamente como precio sugerido en Cotizaciones y Ventas (no modifican `precio_venta`).

### Más vendidos (`/admin/destacados`, solo admin_general)
Curaduría manual de "Los más vendidos" en la landing — **no se calcula de ventas reales**, es herramienta de marketing. Buscador para agregar (`productos_destacados`, único por `producto_id`), lista ordenada por `posicion` con ↑/↓ para reordenar y "Quitar".

### Variantes de producto (`/admin/variantes`, solo admin_general)
Agrupa productos que son el mismo artículo en distinto tamaño/color (cada talla con su propio `producto_id`, precio e inventario) para que en público aparezcan como un solo producto con selector. `VariantesManager.tsx`: crear grupo (buscar productos, etiqueta corta + orden por producto), editar grupo existente, o "Desagrupar" (limpia `variante_grupo_id`/`variante_nombre`). Guardar con menos de 2 miembros disuelve el grupo. Los primeros ~31 grupos se aplicaron con `migrate-agrupar-variantes.mjs` (ya ejecutado, no volver a correr — ver Notas).
⚠️ **NO agrupados a propósito**: tubos Vacutainer (el color indica aditivo químico, no es intercambiable) y productos con tallas abreviadas (`CH`/`MED`/`GDE`) solo agrupados por color dentro de cada talla — completar manualmente si se quiere.

### Dashboard (`/admin`)
Ventas de hoy/mes (clicables → Reportes), cotizaciones pendientes (borrador+enviada), stock bajo (contando productos distintos, no filas de inventario), comparativo por sucursal, top 5 productos del mes (recharts). Nombres en la gráfica horizontal truncados a 26 caracteres (`tickFormatter`); nombre completo en el tooltip.

## Página pública (sin login — `/`, `/catalogo`, `/producto/[id]`)
Usa Tailwind y los mismos colores navy/azul. `SiteHeader`/`SiteFooter` compartidos. Todas son `async` server components con `@/utils/supabase/server` **sin** pasar por `obtenerUsuarioActual()` (no hay sesión, nunca redirigir a `/login`). El middleware solo protege `/admin`. Ya **no existe `/sucursales` como ruta aparte** — fusionada en la landing (`id="sucursales"`).
- **Landing (`/`)** — orden: hero con video, Misión y Visión, "Los más vendidos", "Nuestras Marcas", "Sucursales" (con mapas), CTA final, footer.
  - **Hero**: `<video autoPlay loop muted playsInline>` en `public/hero-video.mov` (buscar el `.mov` más reciente si se reemplaza; no se transcodifica, no hay ffmpeg aquí). Sin overlay — contraste vía `text-white` + `drop-shadow`. `SiteHeader`+hero en wrapper `flex h-screen flex-col` (hero `flex-1`) para ocupar la pantalla completa. Video sobre-escalado+centrado (translate -50%/-50%) para evitar filo blanco por redondeo de aspect-ratio; `margin:0` en html,body también.
  - **"Misión y Visión"**: dos tarjetas lado a lado (una columna en móvil) en `src/app/page.tsx`, texto hardcodeado (no viene de la base de datos) — reemplazó la sección anterior de 3 recuadros ("Calidad garantizada"/"Atención personalizada"/"3 sucursales").
  - **"Los más vendidos"** (`MasVendidosSection.tsx`, client): curado a mano, no ventas reales. Si `productos_destacados` está vacío, `return null`.
  - **"Nuestras Marcas"** (`MarcasCarousel.tsx`): carrusel CSS puro — lista duplicada (`[...marcas, ...marcas]`) en `flex w-max` con `animate-marcas-scroll` (`translateX(0)→translateX(-50%)`, 35s linear infinite). Logos en `public/marcas/*`.
  - **"Sucursales"**: mapas + dirección + teléfono + "Cómo llegar", `id="sucursales"`. Header/footer enlazan a `/#sucursales` con `scroll-behavior: smooth`.
- **Catálogo (`/catalogo`)** — `page.tsx` trae TODOS los productos activos en una query (1,376 filas no amerita paginar en servidor), pasa a `CatalogoClient`: buscador (nombre/código, soporta `?buscar=`) + `CategoriasMegaMenu`. Scroll infinito vía `IntersectionObserver` (lotes de 24, `rootMargin: '400px'`). `next/image` con dominio de Supabase Storage en `next.config.ts`; si `imagen_url` es null, logo de Fuerza Médica como fallback (mismo en `CartDrawer.tsx`). Cada tarjeta usa `ProductoImagen` (hover → `imagen_url_hover`) y enlaza a `/producto/[id]`; "Agregar al carrito" (ya no hay "Solicitar"). Variantes de mismo `variante_grupo_id` se colapsan a una tarjeta (la de menor `variante_orden`).
- **Mega-menú de categorías** (`CategoriasMegaMenu.tsx`) — botón "Navegar categorías" / "Categoría: X" + "Quitar filtro". Escritorio: flyout 2 columnas (categorías izq, subcategorías der al hover; clic en categoría sin elegir subcategoría filtra "todo en esa categoría"), cierra con clic afuera u `onMouseLeave`. Móvil: acordeón vertical. "Sin categoría" excluida de la lista (buscable por texto). `max-height` + scroll propio en ambas columnas.
- **Página de producto (`/producto/[id]`)** — estilo Amazon/MercadoLibre. `page.tsx`: producto + categoría (breadcrumb) + disponibilidad por sucursal/total (RPC `disponibilidad_producto_publica`) + variantes hermanas (mismo `variante_grupo_id`, por `variante_orden`) + similares (misma categoría o primera palabra del nombre, sin variantes propias). `ProductoDetalleClient.tsx`: imagen con hover, selector de variantes (pastillas, clic navega), disponibilidad por sucursal, cantidad (clamped a existencia total), "Agregar al carrito", descripción, especificaciones, similares.
- **Carrito + checkout por WhatsApp** — "Agregar al carrito" en catálogo/destacados/producto. `CartContext` (`useCart()`) en memoria + `localStorage` (`fm_carrito`), `CartProvider` envuelve la app en `layout.tsx`. `agregar(producto, cantidad?)` default 1. Ícono 🛒 del header abre `CartDrawer`. **"Comprar por WhatsApp"** arma mensaje con productos/cantidades/total, abre `wa.me/525534888324` (número `52`+10 dígitos, sin el `1` viejo). No es checkout real, no descuenta inventario, no se vacía solo (botón "Vaciar carrito" manual). `WhatsAppFloatingButton` (abajo-derecha, en `/`, `/catalogo`, `/producto/[id]`) abre chat directo con saludo genérico — todo el contacto va por ahí.

## Lo que falta por construir
- **Panel admin**: ✅ Completo.
- **Deploy**: [ ] Subir a Vercel · [ ] Configurar variables de entorno en Vercel · [ ] Conectar dominio

## SQL
⚠️ **Pendiente de ejecutar manualmente**: `add-caja-y-pagos-mixtos.sql` (tabla `cortes_caja` + columnas de pagos mixtos/cambio en `ventas` + políticas RLS) — Benji debe correrlo en el SQL Editor de Supabase; el código ya asume que existe (build local pasa porque las llamadas a Supabase no fallan en tiempo de compilación, pero fallarán en runtime hasta que se ejecute). Verificar después de que Benji confirme haberlo corrido.
El resto de migraciones (storage de imágenes, RLS de página pública/`anon`, destacados, detalle de producto público, variantes) ya se corrieron y verificaron contra la base real. Los demás `add-*.sql` en la raíz son registro histórico — no volver a ejecutarlos.
Nota reutilizable: al probar INSERT como `anon` vía REST, usar `Prefer: return=minimal` (igual que `supabase-js` sin `.select()` encadenado) — pedir `return=representation` sin política de SELECT para `anon` da un falso positivo de error.

## Notas importantes
- ⚠️ **Caché de `fetch` de Next.js servía datos viejos de Supabase**: `server.ts` no especificaba qué `fetch` usar, heredaba el parcheado por Next (Data Cache indefinido, incluso en rutas dinámicas). Fix: `server.ts` pasa `global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }` a `createServerClient()` — aplica a todo el proyecto. Cachear algo a propósito debe ser explícito por query, nunca depender del default de Next.
- Límite de filas de Supabase API: 2000 (dashboard) — tope duro del servidor. Usar `fetchTodasLasFilas()` para tablas que puedan superarlo (ej. `inventario`).
- `migrate-data/`: Excel original de productos, no tocar.
- `migrate-productos.mjs`, `update-categorias.mjs`, `migrate-agrupar-variantes.mjs`: scripts ya ejecutados, no volver a correr (`migrate-agrupar-variantes.mjs` es idempotente-riesgoso: crearía grupos nuevos con uuids distintos para los mismos productos).
- Usuario admin: fuerzamedicacoacalco@gmail.com, rol admin_general.
- `sucursales.direccion`: Coacalco y Tultepec tienen dirección real. **Sucursal X sigue en `'Por definir'`** en la base — en la UI se trata como "Próximamente", nunca se muestra el texto literal.
- **`src/app/components/sucursalesInfo.ts`** — mapas de Coacalco/Tultepec usan el **CID exacto del lugar** (`google.com/maps?cid=<decimal>&output=embed`, CID del segundo hex de `!1s0x...:0x<CID_HEX>` en la URL de Maps, convertido con `BigInt('0x...').toString()`). ⚠️ NO usar lat/lng de `!3d!4d` con `q=lat,lng` (pin genérico sin nombre) ni búsqueda de texto `q=<nombre>` (ambigua — falló para Coacalco, cuyo nombre en Google no incluye la ciudad). Próxima sucursal: pedir el link de Maps del lugar real y extraer el CID de ahí. `infoMapaSucursales` guarda `cidEmbed` (URL armada) y `urlCompleta` (link original, usado tal cual en "Cómo llegar"). Hardcodeado aquí (no en la base) porque agregar columnas a `sucursales` requeriría SQL para algo casi fijo. `ordenarSucursales()` fuerza Coacalco → Tultepec → otras.
- Antes de asumir valores permitidos en columnas con CHECK constraint (ej. `estado`), verificar contra la base real — ya causó error 23514 dos veces (`cotizaciones.estado`, `solicitudes_web.estado`).
- ⚠️ **Dark mode quitado a propósito**: `globals.css` tenía `@media (prefers-color-scheme: dark)` que volvía `--foreground` casi blanco, invisible sobre fondos claros con SO en modo oscuro (pasó con inputs/selects y texto público). Bloque quitado completo — el sitio usa colores fijos en todos lados, no debe reaparecer.
- `src/utils/supabase/admin.ts` usa la service role key — solo desde route handlers (`src/app/api/.../route.ts`), nunca desde código que corra en el navegador. Cualquier acción privilegiada nueva debe ir en una API route que llame primero a `requerirAdmin()`.
- ⚠️ **`aplicarEdicionLote()`** manda actualizaciones en lotes (100 ids por `.in()` si el valor nuevo es igual para todas las filas; 50 peticiones concurrentes con `Promise.allSettled` si difiere por fila) — nunca una petición por fila en un solo `Promise.all` sin lotear (saturó el navegador/red con 1,376 productos, una falla cancelaba el reporte de las demás). Cualquier operación en lote nueva sobre miles de filas debe seguir este patrón.

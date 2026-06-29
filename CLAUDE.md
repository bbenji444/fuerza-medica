# Fuerza Médica — Contexto del Proyecto

## ¿Qué es este proyecto?
Sistema de administración + página web pública para **Fuerza Médica**, una tienda de equipo médico y ortopédico con 3 sucursales en México (Coacalco, Tultepec, Sucursal X). Desarrollado por **OVITECH AI & Digital Solutions** (www.ovitech.io).

## Stack tecnológico
- **Frontend/Backend:** Next.js 16 con App Router, TypeScript, Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL) con Row Level Security (RLS)
- **Autenticación:** Supabase Auth
- **PDFs:** jsPDF + jspdf-autotable (cotizaciones, tickets de venta, reporte de stock bajo)
- **Gráficas:** recharts (dashboard)
- **Deployment:** Vercel (pendiente)

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
│   │   │   ├── page.tsx          ← Lista de ventas (server component)
│   │   │   ├── VentasTable.tsx   ← Panel de venta rápida siempre visible + botón "Historial" que oculta/muestra el listado pasado
│   │   │   └── VentaRapidaPanel.tsx ← Panel inline (NO modal): sin pasos, cliente opcional/colapsado, escaneo de código de barras, valida y descuenta stock
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
│   │   └── page.tsx              ← Pantalla de login (con logo)
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
    │   ├── server.ts             ← Cliente Supabase para el servidor (cookies, respeta RLS)
    │   ├── admin.ts              ← SOLO server-side: cliente con service role + requerirAdmin()
    │   └── usuarioActual.ts      ← obtenerUsuarioActual() memoizado con React.cache() (evita repetir auth+usuarios)
    ├── fetchTodasLasFilas.ts     ← Pagina automáticamente consultas que puedan superar 2000 filas
    ├── aplicarEdicionLote.ts     ← UPDATE en lote (uno solo con .in() o varios en paralelo)
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
- **productos** — 1,376 productos con codigo, nombre, precio_costo, precio_venta, precio_mayoreo, categoria_id, activo, **imagen_url** (text, nullable — se llena desde `/admin/inventario`, botón "+ Imagen"/"Cambiar imagen"; en el catálogo público y la landing, si está vacío se muestra el logo de Fuerza Médica como placeholder, no un emoji), **imagen_url_hover** (text, nullable — segunda imagen que se muestra al pasar el mouse, mismo modal de admin), **descripcion** (text, nullable — se muestra en la página pública de producto), **variante_grupo_id / variante_nombre / variante_orden** — agrupan productos que son el mismo artículo en distinto tamaño/color (ver "Variantes de producto" abajo)
- **productos_destacados** — curaduría manual de "Los más vendidos" en la landing (producto_id FK único, posicion). Gestionada desde `/admin/destacados`. NO refleja ventas reales.
- **inventario** — Stock por sucursal (producto_id + sucursal_id + existencia + inventario_minimo + inventario_maximo). Las 3 sucursales tienen el mismo listado de productos replicado (pendiente que el usuario lo ajuste sucursal por sucursal)
- **usuarios** — admin_general + operadores por sucursal. Campo `rol` puede ser 'admin_general' o 'operador'. `id` es el mismo uuid que `auth.users.id` (no tiene default, se asigna al crear el usuario de Auth). Los empleados se crean desde `/admin/empleados`, que también crea el usuario de Supabase Auth correspondiente vía API route con service role
- **clientes** — Datos de clientes para cotizaciones/ventas (nombre, telefono, correo, direccion)
- **cotizaciones** — Cabecera (cliente_id, sucursal_id, usuario_id, estado, total). **`estado` tiene un CHECK constraint**: valores válidos son `'borrador'`, `'enviada'`, `'aceptada'`, `'cancelada'` (⚠️ NO `'rechazada'` — ese valor no pasa el constraint, ya se intentó y falla con error 23514)
- **cotizacion_items** — Detalle por cotización (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal generado)
- **ventas** — Cabecera (folio autogenerado tipo `V-0001` vía secuencia, sucursal_id, usuario_id, cliente_id nullable, metodo_pago, total, cotizacion_id nullable si vino de una conversión)
- **venta_items** — Detalle por venta (venta_id, producto_id, cantidad, precio_unitario, subtotal generado)
- **promociones** — Descuentos por producto o categoría (tipo: porcentaje/precio_fijo/precio_especial, valor, producto_id o categoria_id, activa, fecha_inicio/fecha_fin opcionales)
- **solicitudes_web** — Tabla sigue existiendo en la base (histórico), pero el formulario público "Solicitar producto" y el módulo `/admin/solicitudes` se quitaron por decisión del negocio: todo contacto del cliente se atiende directo por WhatsApp (botón flotante + "Comprar por WhatsApp" del carrito), ya no se necesita un formulario de solicitud aparte.

### Funciones SQL (RPC y helpers de RLS)
- **descontar_inventario(p_producto_id, p_sucursal_id, p_cantidad)** — UPDATE atómico condicional (`WHERE existencia >= p_cantidad`). Si no hay stock suficiente, **no actualiza nada y devuelve una fila con todos los campos en `null`** (no un `null` real — hay que revisar `data.id == null`, no `!data`). Usado al crear ventas y al convertir cotizaciones en ventas. **`security definer`** con chequeo explícito `es_admin() or p_sucursal_id = mi_sucursal()` dentro de la función (no puede depender de RLS de `inventario`, porque esa tabla solo permite UPDATE a admin — ver gotcha abajo).
- **incrementar_inventario(p_producto_id, p_sucursal_id, p_cantidad)** — mismo patrón, para devolver stock (rollback de ventas fallidas, o al borrar una venta).
- **es_admin()** — `security definer`, devuelve true si `auth.uid()` tiene `rol = 'admin_general'` en `usuarios`. Usado en políticas RLS para no depender de checks en el cliente.
- **mi_sucursal()** — `security definer`, devuelve el `sucursal_id` del usuario autenticado. Usado para que cada operador solo vea su propia sucursal.
- **disponibilidad_producto_otras_sucursales(p_producto_id, p_sucursal_actual)** — devuelve `(sucursal_nombre, existencia)` de un producto puntual en las DEMÁS sucursales (excluye `p_sucursal_actual`). `security definer` intencional: un operador no puede ver el inventario de otra sucursal por RLS, pero sí necesita saber "¿hay esto en otra sucursal?" al vender algo sin stock — esta función abre una rendija controlada (solo ese producto, solo nombre+existencia, nunca precios) sin tocar la política general de `inventario`. Usada en `VentaRapidaPanel` vía `useEffect` cuando un renglón del carrito tiene `existencia === 0` o `cantidad > existencia`.
- **disponibilidad_producto_publica(p_producto_id)** — mismo patrón que la anterior pero para `anon` (página pública de producto): devuelve `(sucursal_nombre, existencia)` de TODAS las sucursales activas para un producto puntual. La tabla `inventario` no tiene política para `anon` a propósito (el catálogo no expone existencias completas); esta función abre la misma rendija controlada (un producto a la vez, sin precios) para que `/producto/[id]` pueda mostrar "disponible en qué sucursal" y el total.
- ⚠️ **Gotcha ya vivido**: si una función RPC necesita hacer un UPDATE/DELETE que un operador normal NO tendría permiso de hacer directamente vía RLS (como descontar stock al vender), la función **debe ser `security definer`** y validar el permiso ELLA MISMA (`es_admin()`/`mi_sucursal()`), porque si es `security invoker` (el default), corre con los permisos de quien la llama y RLS la bloquea en silencio — esto causó que cuentas de operador no pudieran completar ventas (la función fallaba sin error visible, devolviendo la fila con `null`, y la app lo interpretaba como "sin stock"). Antes de agregar cualquier RPC que toque tablas restringidas a admin, pensar si los operadores necesitan invocarla.

### Políticas RLS activas
La mayoría son para rol `authenticated` (panel admin). Las marcadas explícitamente `anon` son para la página web pública (sin login) — son políticas DISTINTAS y ADICIONALES, no reemplazan a las de `authenticated`.
- **productos**: SELECT abierto (`authenticated`); INSERT/UPDATE/DELETE solo `es_admin()`. **Para `anon`** (catálogo público): SELECT solo `activo = true`, y además **column-level grant restringido** (`grant select (id, codigo, nombre, precio_venta, categoria_id, imagen_url, activo, creado_en) on productos to anon`, ampliado después con `imagen_url_hover, descripcion, variante_grupo_id, variante_nombre, variante_orden`) — un visitante sin login JAMÁS puede leer `precio_costo` ni `precio_mayoreo` aunque la fila pase el RLS, porque ni siquiera tiene permiso de columna. ⚠️ Si se agrega un nuevo campo sensible a `productos`, hay que revisar si el grant de `anon` necesita actualizarse (por default Supabase otorga SELECT de TODA la tabla a `anon`, así que cualquier columna nueva queda expuesta a menos que se revoque explícitamente).
- **inventario**: SELECT solo `es_admin() or sucursal_id = mi_sucursal()`; INSERT/UPDATE/DELETE solo `es_admin()`. Sin política para `anon` — el catálogo público no expone existencias completas (la única rendija es la función `disponibilidad_producto_publica`, ver arriba).
- **sucursales, categorias**: SELECT abierto para `authenticated` Y para `anon` (`categorias`: sin filtro; `sucursales`: solo `activa = true`) — usadas en filtros del catálogo, footer y la sección "Sucursales" de la landing.
- **solicitudes_web**: las políticas (`authenticated`+`es_admin()` para SELECT/UPDATE, INSERT abierto para `anon`) siguen existiendo en la base pero ya no se usan — el módulo de admin y el formulario público se quitaron (ver tabla arriba).
- **productos_destacados**: SELECT para `authenticated` y `anon` (con column-level grant igual de restringido que `productos`, mismo patrón); INSERT/UPDATE/DELETE solo `es_admin()` (gestión desde `/admin/destacados`).
- **clientes**: SELECT/INSERT/UPDATE/DELETE abiertos (sin scoping por sucursal — un cliente puede comprar en cualquier sucursal)
- **usuarios**: SELECT solo `auth.uid() = id or es_admin()` (cada uno ve su propia fila; admin ve todas). Sin políticas de INSERT/UPDATE — esas escrituras solo pasan por las API routes con service role
- **cotizaciones, ventas**: SELECT/INSERT/UPDATE(solo cotizaciones)/DELETE scoped a `es_admin() or sucursal_id = mi_sucursal()`
- **cotizacion_items, venta_items**: SELECT/INSERT/DELETE heredan el alcance de su cotización/venta padre vía `exists(...)`
- **promociones**: SELECT abierto (para calcular descuentos al cotizar/vender); INSERT/UPDATE/DELETE solo `es_admin()`
- **configuracion**: SELECT abierto; UPDATE solo `es_admin()`. Una sola fila con `margen_ganancia` (default 70) e `iva_porcentaje` (default 16), usada por la Calculadora de precio en Ventas.
- ⚠️ **Gotcha ya vivido**: las políticas "abiertas" creadas en versiones anteriores del proyecto (`sucursales`, `categorias`, `solicitudes_web`) en realidad solo aplicaban a `to authenticated` — un visitante sin sesión (`anon`) obtenía `[]` de TODO, confirmado con una prueba real antes de construir la página pública. RLS de Postgres es por rol; "SELECT abierto" en notas previas de este archivo significaba "abierto para cualquier usuario CON sesión", no "público". Cualquier tabla nueva que la página pública necesite leer requiere su propia política `to anon` explícita.
- Todas las políticas de las tablas de catálogo/transacciones (`.sql` en la raíz, ya ejecutados, se conservan como registro): `add-rls-cotizaciones.sql`, `add-rls-cotizaciones-edicion.sql`, `add-rls-clientes-edicion.sql`, `add-rls-cotizaciones-delete.sql`, `add-tablas-ventas.sql`, `add-rls-ventas-delete.sql`, `add-rls-promociones.sql`, `add-funciones-inventario.sql`, `add-empleados-rls-roles.sql`, `add-rls-productos-inventario-alta-baja.sql`, `add-fix-descontar-inventario-operadores.sql`, `add-tabla-configuracion.sql`, `add-funcion-disponibilidad-otras-sucursales.sql`, `add-storage-imagenes-productos.sql`, `add-rls-solicitudes-web-publico.sql`, `add-rls-publico-pagina-web.sql`

### Storage (Supabase Storage)
- **Bucket `productos`** (público) — imágenes de producto. Creado vía SQL (`insert into storage.buckets...`) en `add-storage-imagenes-productos.sql`, ya que no hay Management API/conexión directa a Postgres disponible en este entorno para crearlo por código.
- Políticas en `storage.objects`: INSERT/UPDATE/DELETE solo `authenticated` + `es_admin()` (subir/cambiar/borrar imagen desde `/admin/inventario`); SELECT público (`to public`) — el catálogo web necesita poder mostrar la imagen sin sesión.
- Ruta de archivo: `{producto_id}.{extensión}` con `upsert: true` — re-subir para el mismo producto reemplaza el archivo. La URL guardada en `productos.imagen_url` lleva un query param `?t=timestamp` para evitar que el navegador muestre una versión cacheada vieja tras reemplazar la imagen.

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ujknambmwsomjungybvf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...  ← Solo para scripts de migración, NUNCA en el frontend
```

## Patrones de código establecidos

### Server components (page.tsx)
- Verifican sesión con `obtenerUsuarioActual()` (`@/utils/supabase/usuarioActual`) — si no hay `user`, redirigen a `/login`; si la página es admin-only y `usuario.rol !== 'admin_general'`, redirigen a `/admin/cotizaciones`. No volver a escribir `auth.getUser()` + select de `usuarios` a mano — layout.tsx ya lo llama, y duplicarlo es exactamente el tipo de query redundante que ya causó lentitud (ver sección Rendimiento)
- El resto de las queries de datos (las que no dependen del resultado de otra) van en un solo `Promise.all([...])`, nunca en `await` sueltos uno tras otro
- Traen datos de Supabase y los pasan como props al componente interactivo
- Usan `import { createClient } from '@/utils/supabase/server'` para las queries de datos (after del check de usuario)
- Si una consulta puede superar 2000 filas (tablas sin filtrar por sucursal, ej. `inventario` completo), usar `fetchTodasLasFilas()` en vez de `.range()` directo — el límite de 2000 es un tope duro del servidor, no se evita pidiendo un rango mayor

### Client components (Tabla*.tsx / *Modal.tsx)
- Siempre empiezan con `'use client'`
- Manejan estado local (búsqueda, filtros, modal de edición)
- Usan `import { createClient } from '@/utils/supabase/client'`
- Después de guardar cambios usan `router.refresh()` para refrescar datos
- Modales de creación con varios pasos (cotización, venta) usan un `useRef` (`guardandoRef`) además del estado `guardando`, para bloquear doble-submit de forma síncrona (el estado de React no alcanza a re-renderizar entre dos clicks muy rápidos)
- Items de carrito usan un `id` generado en cliente (`crypto.randomUUID()`) como key de React e identificador de fila — nunca usar `producto_id` como key porque puede repetirse (un mismo producto puede tener más de un renglón)

### Estilo visual
- Colores principales: Navy `#0D1B3E`, Azul `#1A6DD4`, Fondo `#F4F8FF`
- Colores de estado: verde `#1A7A3E`/`#E8F7EE` (positivo/vigente), azul `#1A6DD4`/`#E3EEFD` (enviada/programada), rojo `#B81C1C`/`#FDE8E8` (negativo/expirado/stock bajo), gris `#888`/`#F0F4FB` (neutral/inactivo)
- Sin Tailwind en componentes existentes — usar estilos en línea (inline styles)
- Sidebar oscuro (`#0D1B3E`) con logo (`/logo fuerza medica.jpg`, fondo blanco redondeado, centrado), contenido en fondo claro (`#F4F8FF`)
- Todos los inputs/selects deben tener `color: #1A1A1A` — ya definido en globals.css

## Control de acceso por rol (admin_general vs operador)
- **admin_general**: ve y administra todo (Inicio/dashboard, Inventario de las 3 sucursales con precios, Cotizaciones/Ventas de todas las sucursales, Reportes, Promociones, Empleados).
- **operador**: Sidebar solo muestra Inventario, Cotizaciones, Ventas. No puede entrar a `/admin` (dashboard), `/admin/reportes`, `/admin/promociones` ni `/admin/empleados` — esas páginas redirigen a `/admin/cotizaciones` si el rol no es admin_general. Solo ve y opera la sucursal que tiene asignada en `usuarios.sucursal_id` (cotizaciones, ventas e inventario de otras sucursales ni siquiera se devuelven por RLS). En Inventario no ve checkboxes, edición en lote ni el botón "Editar" (visualización únicamente, incluyendo precios).
- Esto está reforzado tanto en la UI (props `esAdmin`/`rol` que ocultan controles) como en RLS (`es_admin()`/`mi_sucursal()`) — un operador no puede saltarse la restricción llamando a la API directamente.

## Rendimiento
Patrones obligatorios para que las páginas no se sientan lentas (la latencia base a Supabase desde este entorno es ~220-330ms **por request**, medido directo contra el REST API — así que cada llamada secuencial de más se siente):
- **Paralelizar todo lo independiente** en cada `page.tsx` con `Promise.all([...])`. Nunca hacer `await` de queries independientes una tras otra — antes de la auditoría de rendimiento, `cotizaciones/page.tsx` y `ventas/page.tsx` hacían ~6-7 queries secuenciales (cotizaciones, clientes, productos, sucursales, inventario paginado, promociones) sumando 2-3+ segundos solo en viajes de red.
- **`obtenerUsuarioActual()`** (en `src/utils/supabase/usuarioActual.ts`, envuelto en `React.cache()`) reemplaza las llamadas repetidas a `auth.getUser()` + `select rol/sucursal_id` que antes se hacían por separado en `layout.tsx` Y en cada `page.tsx` — con `cache()` solo se ejecuta una vez por request aunque se llame varias veces en el árbol de render. Todo `page.tsx` nuevo debe usar este helper, no volver a escribir el `getUser()` + select manual.
- **`fetchTodasLasFilas`** usa lotes de 2000 (el tope real del servidor) — usar lotes más chicos solo multiplica los viajes de red sin necesidad.
- Las librerías pesadas (jsPDF ~440KB, xlsx ~292KB, recharts ~336KB) **ya están bien separadas por ruta** por el bundler de Next — se verificó con los `page_client-reference-manifest.js` de cada ruta que páginas como Empleados/Promociones no las cargan. No es necesario (ni se debe asumir) que esto sea la causa si algo se siente lento; medir antes de optimizar.
- Pendiente de evaluar si se justifica: las páginas de Cotizaciones/Ventas cargan el catálogo completo de productos + inventario + promociones en cada visita a la LISTA, aunque solo se necesita al abrir el modal de "Nueva cotización/venta". Diferir ese fetch a cuando se abre el modal (en vez de en el `page.tsx`) reduciría el costo de simplemente ver la lista, a cambio de un pequeño spinner al crear una nueva. No implementado todavía — preguntar antes de hacerlo, es un cambio de arquitectura, no un fix menor.
- Otra opción de bajo esfuerzo: subir el límite de filas de Supabase (Dashboard → API settings) por encima de 2000, igual que se hizo antes — reduciría aún más los lotes de `fetchTodasLasFilas` para `inventario` a medida que crece.

## Módulos construidos hasta ahora

### Empleados (`/admin/empleados`, solo admin_general)
Alta de empleados: crea el usuario en Supabase Auth (vía `auth.admin.createUser` con service role, en `/api/empleados`) y su fila en `usuarios` (nombre, rol, sucursal) en la misma operación. Editar datos, **resetear contraseña**, y **activar/desactivar acceso** (desactivar usa `auth.admin.updateUserById` con `ban_duration` para bloquear el login a nivel Auth, además de marcar `activo=false`). Nunca se borra el usuario (se conserva el historial de cotizaciones/ventas que registró). Importante: si el empleado tiene una sesión activa, el bloqueo por ban tarda hasta que su token actual expire (no hay invalidación inmediata de sesión).

### Inventario (`/admin/inventario`) — fusiona Productos + Inventario
Una sola tabla por sucursal con código/nombre/categoría/**precios** (tabla `productos`) junto con existencia/mínimo/máximo (tabla `inventario`). La query es un solo `select` desde `inventario` con `productos(...)` embebido — no dos fetches separados. Cada fila combinada carga DOS ids (`producto_id` e `inventario_id`); el modal de edición en lote (`EdicionLoteModal`) sabe, por cada campo (`CampoLoteDef.tabla` / `idCampo`), a qué tabla y con qué id debe escribir (precios/categoría/activo → `productos`; existencia/mínimo/máximo → `inventario`). El modal "Editar" individual hace los dos `UPDATE` (uno por tabla) en el mismo submit.
"Stock bajo" = `existencia <= inventario_maximo / 3` (no usa `inventario_minimo`). Contador de productos en stock bajo + reporte en **PDF y Excel** (stock bajo o inventario completo). **"+ Agregar producto"** crea el producto y su fila de inventario en las 3 sucursales (existencia inicial solo en la sucursal activa, 0 en las demás). **"Borrar"** primero verifica que no tenga cotizaciones/ventas/promociones asociadas (si las tiene, bloquea con mensaje claro) y si no, borra `inventario` (las 3 sucursales) y luego `productos`. Todo lo de edición/alta/baja es solo admin_general; un operador solo ve su propia sucursal, sin selector de sucursal ni botones de edición. Ya no existe el campo "activo" en la UI (se asume que si el producto está en el listado, está activo — para retirarlo se borra, no se desactiva).
**"+ Imagen" / "Cambiar imagen"** (botón por fila, solo admin): modal con preview, input de archivo (solo `image/*`, máx. 5MB validado en cliente), sube a Supabase Storage (bucket `productos`, ruta `{producto_id}.{ext}`, `upsert: true`) y guarda la URL pública (con `?t=timestamp` para evitar caché del navegador) en `productos.imagen_url`. Botón "Quitar" limpia el campo (no borra el archivo de Storage, para mantener el código simple). Esta imagen es la que se muestra en el catálogo público.

### Cotizaciones (`/admin/cotizaciones`)
Crear/editar cotización: cliente (buscar/crear/editar/borrar inline) + productos (con disponibilidad de stock en tiempo real y precio con descuento si hay promoción vigente) + total automático. Exportar PDF, borrar, cambiar estado, y **"Convertir en venta"** (solo visible si `estado = 'aceptada'`) que pide método de pago, copia los productos a una venta nueva, descuenta inventario y genera el ticket.

### Calculadora de precio (en Ventas, detrás de un botón colapsable)
Uso interno, no toca `precio_venta` del producto. Costo (manual o tomado de un producto del catálogo) → + Ganancia % (default 70, viene de `configuracion`) → Subtotal → + IVA % (default 16) → Precio final. Cualquiera puede usarla con valores temporales; solo admin_general puede "Guardar como nuevo default" (persiste en `configuracion`, afecta a todos).
También existe **integrada directamente en la tabla del carrito de `VentaRapidaPanel`** (no en un panel aparte — columnas extra "Costo" y "% Ganancia" junto a Cantidad/Precio/Subtotal de cada renglón), con un enfoque distinto al widget standalone: el campo "% Ganancia" no parte del default de `configuracion`, sino que **muestra el margen que YA se está aplicando hoy**, calculado al revés desde `precio_costo` vs. el `precio_unitario` actual del renglón (`margenActual()`: `(precio_sin_iva / costo - 1) * 100`, con un IVA % compartido editable arriba de la tabla). Cambiar el % de un renglón recalcula y aplica el nuevo precio **al instante** (sin botón "Aplicar" ni desglose adicional); el campo "Precio" sigue editable directamente como override manual. Arriba de la tabla hay "Ganancia % para todos" + botón "Aplicar a todos" para fijar el mismo % nuevo en todos los renglones de un solo golpe. Cada item del carrito guarda su `precio_costo` al agregarse (tomado de `productos.precio_costo`); **Costo es siempre un recuadro editable** (mismo formato para todos los renglones, no un "—" condicional) — si el producto no tiene costo en el catálogo aparece en $0.00 y se puede capturar ahí mismo para esa venta, lo cual habilita también el cálculo de "% Ganancia" sin tener que editar el producto en Inventario primero. La tabla también tiene una columna **"IVA"** por renglón (`ivaDeLinea()`: el IVA incluido en el subtotal de esa línea, `subtotal - subtotal/(1+iva/100)` — funciona aunque el producto no tenga costo registrado, solo depende del IVA % y el precio) y, junto al Total, una línea **"IVA incluido: $X"** con la suma de IVA de todo el carrito.

### Ventas (`/admin/ventas`) — optimizado para velocidad, no para historial
A diferencia de Cotizaciones, **no es un modal**: `VentaRapidaPanel` está siempre visible en la página, sin pasos (cliente, sucursal/método de pago y productos en una sola pantalla). Cliente es opcional y colapsado por defecto (botón "+ Agregar cliente (opcional)") — la mayoría de las ventas no necesitan registrar cliente. El listado de ventas pasadas vive detrás de un botón **"Historial (N)"** que lo oculta/muestra (antes era la vista por defecto, lo cual iba en contra del flujo rápido que necesitan los cajeros el 80% del tiempo). Tiene **soporte de escáner de código de barras** (ver sección abajo). **Valida y descuenta stock atómicamente al guardar** — si no hay suficiente, no se crea la venta y se revierte cualquier descuento parcial ya aplicado. Si un renglón del carrito tiene `existencia === 0` o cantidad mayor al stock, consulta automáticamente (RPC `disponibilidad_producto_otras_sucursales`) y muestra **"Disponible en: X (n), Y (n)"** debajo del producto, para que el vendedor le pueda decir al cliente dónde sí hay — sin que el operador pueda ver el inventario completo de otras sucursales (solo ese dato puntual). Al completar una venta, el panel se reinicia solo (carrito vacío, cliente quitado, foco de vuelta en el input) listo para la siguiente, y muestra una confirmación con folio + botón opcional "Generar ticket". El historial conserva "Generar ticket" (PDF tipo recibo) y "Borrar" (restituye el stock al inventario).

## Escaneo de código de barras (Cotizaciones y Ventas)
Un escáner USB de código de barras se comporta como un teclado: escribe los caracteres del código y presiona Enter. Patrón usado en `NuevaCotizacionModal.tsx` y `VentaRapidaPanel.tsx`:
- El input de "Buscar o escanear producto" tiene un `ref` y se enfoca con `useEffect` al entrar al paso de productos (o al montar, en el caso de Ventas que no tiene pasos) — y se vuelve a enfocar después de cada producto agregado y después de cada venta/cotización guardada.
- `onKeyDown`: si `e.key === 'Enter'`, se busca una coincidencia **exacta** (`p.codigo.toLowerCase() === texto.toLowerCase()`, no `.includes()`) y si existe se agrega al carrito y se limpia el input; si no existe, se muestra "Producto no encontrado: ..." y se limpia el input igual (para no bloquear el siguiente escaneo).
- `agregarProducto()` ahora **incrementa la cantidad** si el producto ya está en el carrito, en vez de no hacer nada — necesario para que escanear el mismo código dos veces equivalga a cantidad 2 (comportamiento esperado de un punto de venta).
- La búsqueda difusa (mientras se escribe, sin Enter) sigue funcionando igual para selección manual con el mouse.

### Reportes (`/admin/reportes`, solo admin_general)
Desglose de qué se vendió: selector Hoy/Esta semana/Este mes, o un rango de fechas personalizado (inputs `type="date"`). Dos vistas intercambiables con un toggle:
- **"Por venta"** (default) — una tarjeta por cada venta (`ventas` con `venta_items(productos(...))`, `clientes(nombre)` y `sucursales(nombre)` anidados en un solo select), con folio/fecha/cliente/método de pago/total arriba y la lista de productos de esa venta debajo — así se ve de un vistazo qué se vendió junto y a quién. Cada tarjeta tiene un borde de color por sucursal (`paletaSucursales`, asignado dinámicamente por orden de aparición vía `colorDe()`), reforzando visualmente el comparativo por sucursal.
- **"Por producto"** — la tabla agrupada por **producto + fecha** de siempre (no solo por producto — así se ve en qué día se vendió cada cosa), con cantidad y total; es la que alimenta el PDF.
Comparativo por sucursal y botón para descargar el desglose por producto en PDF. Las tarjetas "Ventas de hoy"/"Ventas del mes" del dashboard enlazan aquí con el periodo correspondiente.

### Promociones (`/admin/promociones`)
Descuentos por producto específico o por categoría completa, con tipo (% / monto fijo / precio especial) y vigencia opcional (fecha_inicio/fecha_fin). Se aplican automáticamente como precio sugerido al agregar productos en Cotizaciones y Ventas (no modifican `precio_venta` en la tabla `productos`).

### Más vendidos (`/admin/destacados`, solo admin_general)
Curaduría manual de qué productos se muestran en la sección "Los más vendidos" de la landing pública — **no se calcula de ventas reales**, es a propósito una herramienta de marketing para que el negocio promocione lo que quiera (aunque no sea lo más vendido de verdad). Buscador para agregar productos (`productos_destacados`, único por `producto_id`), lista ordenada por `posicion` con botones ↑/↓ para reordenar (intercambia `posicion` entre el item y su vecino) y "Quitar".

### Variantes de producto (`/admin/variantes`, solo admin_general)
Agrupa productos que son **el mismo artículo en distinto tamaño o color** (ej. "Bota Neumática Walker" chica/mediana/grande, cada talla con su propio `producto_id`, precio e inventario por sucursal) para que en la página pública aparezcan como un solo producto con un selector. `VariantesManager.tsx` deja crear un grupo nuevo (buscar productos, agregarlos a una lista de trabajo, ponerle una etiqueta corta a cada uno como "Grande"/"Rojo" + un orden), editar un grupo existente (agregar/quitar miembros, cambiar etiquetas) o "Desagrupar" (limpia `variante_grupo_id`/`variante_nombre` de todos los miembros, cada producto sigue existiendo normal). Guardar un grupo con menos de 2 miembros lo disuelve en vez de dejar un "grupo" de un solo producto. Los primeros ~31 grupos (talla/color) se identificaron y aplicaron con un script de migración (`migrate-agrupar-variantes.mjs`, en la raíz) que detecta palabras de talla/color en el nombre, descarta grupos con etiquetas duplicadas o precios muy distintos entre sí (señal de que no son la misma cosa), y agrupa por categoría+nombre-base; los casos con typos en el nombre original (ej. "MEDWAY" vs "MEDWEY") se agregaron a mano dentro del mismo script — el detector automático no intenta corregir typos, por diseño, para no arriesgar falsos positivos.
⚠️ **Casos NO agrupados a propósito**: tubos Vacutainer (el color indica el aditivo químico del tubo, no es un "color de empaque" intercambiable) y un puñado de productos con tallas abreviadas (`CH`/`MED`/`GDE` en vez de la palabra completa) que solo se agruparon por color dentro de esa talla, no entre tallas — se puede completar manualmente desde `/admin/variantes` si se quiere.

### Dashboard (`/admin`)
Ventas de hoy/mes (clicables → Reportes), cotizaciones pendientes (borrador + enviada), productos con stock bajo (**contando productos distintos**, no filas de inventario — un producto en 3 sucursales no debe contarse 3 veces), comparativo de ventas por sucursal y top 5 productos más vendidos del mes (gráficas con recharts). El nombre de producto en la gráfica horizontal se trunca a 26 caracteres con `tickFormatter` (los nombres reales de productos médicos son largos y se encimaban con el ancho de eje default de recharts) — el nombre completo sigue apareciendo en el tooltip al pasar el mouse.

## Página pública (sin login — `/`, `/catalogo`, `/producto/[id]`)
Usa Tailwind (a diferencia del admin, que usa estilos en línea) y los mismos colores navy/azul. `SiteHeader`/`SiteFooter` compartidos entre las páginas. Todas son `async` server components que llaman `createClient()` de `@/utils/supabase/server` **sin** pasar por `obtenerUsuarioActual()` (no hay sesión que verificar, y nunca se debe redirigir a `/login` desde aquí). El middleware (`middleware.ts`) solo protege rutas que empiecen con `/admin`, así que estas páginas no se ven afectadas. ⚠️ Ya **no existe `/sucursales` como ruta aparte** — el usuario pidió fusionarla dentro de la landing (ver abajo); si se necesita ese contenido, está en la sección "Sucursales" de `/`.
- **Landing (`/`)** — en orden: hero con video de fondo, 3 tarjetas de valores, **"Los más vendidos"** (`MasVendidosSection`, curado manualmente — ver `productos_destacados` abajo), **"Nuestras Marcas"** (`MarcasCarousel`), **"Sucursales"** (`id="sucursales"`, con mapas — ver abajo), CTA final, footer.
  - **Hero**: `<video autoPlay loop muted playsInline>`, archivo en `public/hero-video.mov` (el usuario lo ha reemplazado más de una vez desde su carpeta de Descargas — buscar por nombre o por ser el `.mov` más reciente si hace falta encontrarlo de nuevo; no se transcodifica a `.mp4` porque no hay `ffmpeg` en este entorno). **Sin overlay ni panel de fondo encima del video** — el contraste del texto se logra con `text-white` (el mismo color que el header/nav, a propósito) + `drop-shadow`. `SiteHeader` + la sección del hero viven juntos dentro de un wrapper `flex h-screen flex-col` (el hero es `flex-1`) — así el header+hero ocupan exactamente la pantalla completa al cargar, sin importar la altura real del header ni el tamaño del monitor; el resto de las secciones van en un `<main>` aparte, fuera de ese wrapper. El video usa el truco de sobre-escalar+centrar (`h-full min-h-full w-full min-w-full` + `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`) — con `min-h`/sin el truco de centrado quedaba un filo blanco visible en una esquina por redondeo de aspect-ratio; también se reseteó `margin:0` en `html,body` en `globals.css` como defensa adicional.
  - **"Los más vendidos"** (`MasVendidosSection.tsx`, client component): NO se calcula de ventas reales — es una lista que el dueño cura a mano desde `/admin/destacados` (tabla `productos_destacados`), pensada para promocionar lo que el negocio quiera aunque no sea realmente lo más vendido. Si la tabla está vacía, la sección completa no se renderiza (`return null`).
  - **"Nuestras Marcas"** (`MarcasCarousel.tsx`): carrusel infinito con **CSS puro** (sin librería ni JS de animación) — la lista de logos se duplica (`[...marcas, ...marcas]`) dentro de un `flex w-max` con la clase `animate-marcas-scroll` (`@keyframes marcas-scroll` en `globals.css`: `translateX(0)` → `translateX(-50%)`, `35s linear infinite`) — al llegar a la mitad (donde empieza la copia duplicada) se ve idéntico al inicio, por eso el loop no se nota. Logos en `public/marcas/*` (renombrados a kebab-case al copiarlos desde la carpeta "Marcas" de Descargas del usuario).
  - **"Sucursales"**: contenido que antes vivía en la ruta `/sucursales` (mapas + dirección + teléfono + "Cómo llegar"), ahora inline en la landing con `id="sucursales"`. El link "Sucursales" del header/footer apunta a `/#sucursales` (no a una ruta aparte) — con `scroll-behavior: smooth` en `globals.css`, el navegador hace scroll suave al llegar.
- **Catálogo (`/catalogo`)** — `page.tsx` trae TODOS los productos activos en una sola query (igual al patrón ya usado en Cotizaciones/Ventas: 1,376 filas no amerita paginar en servidor) y los pasa a `CatalogoClient` (client component), que filtra en memoria: buscador (nombre/código, soporta `?buscar=` en la URL desde el buscador del header) + categorías vía `CategoriasMegaMenu` (ver abajo). **Scroll infinito** vía `IntersectionObserver` sobre un `div` centinela al final de la grilla (lotes de 24, `rootMargin: '400px'`). Usa `next/image` con el dominio de Supabase Storage agregado a `images.remotePatterns` en `next.config.ts`; **si `imagen_url` es null se muestra el logo de Fuerza Médica** (`/logo fuerza medica.jpg`, más chico y circular vía clases condicionales) — antes era un emoji ⚕️, el usuario pidió el logo real. Mismo fallback en `CartDrawer.tsx`. Cada tarjeta usa `ProductoImagen` (cambia a `imagen_url_hover` al pasar el mouse, si existe) y enlaza a `/producto/[id]`; tiene "Agregar al carrito" (ya no existe el botón "Solicitar" — se quitó junto con todo el módulo de solicitudes web). Las **variantes de tamaño/color** (mismo `variante_grupo_id`) se colapsan a una sola tarjeta — la de menor `variante_orden` entre las que coincidieron con la búsqueda/filtro activo — para que no aparezcan 3 tarjetas casi idénticas de "chica/mediana/grande".
- **Mega-menú de categorías** (`CategoriasMegaMenu.tsx`) — reemplaza el selector de dos pasos categoría→subcategoría. Botón "Navegar categorías" (o "Categoría: X" si ya hay un filtro activo, con un "Quitar filtro ✕" al lado). En escritorio: flyout de 2 columnas (categorías principales a la izquierda, sus subcategorías a la derecha al pasar el mouse — clic en una subcategoría filtra y cierra el menú; clic en la categoría misma, sin elegir subcategoría, filtra a "todo en esa categoría"); se abre con hover o clic en el botón, se cierra con clic afuera o `onMouseLeave` del contenedor completo (sin gap entre el botón y el panel, para que no se cierre solo al mover el mouse hacia abajo). En móvil: mismo botón pero el panel es un acordeón vertical (clic en una categoría la expande/colapsa inline). La categoría "Sin categoría" se excluye de la lista a propósito (productos sin categorizar aún, pendiente de catalogar) — sigue siendo encontrable por el buscador de texto. Ambas columnas tienen `max-height` + scroll propio como red de seguridad para pantallas bajas.
- **Página de producto (`/producto/[id]`)** — estilo tipo Amazon/MercadoLibre. `page.tsx` (server component) trae el producto + categoría (con breadcrumb si tiene categoría padre) + disponibilidad por sucursal y total (RPC `disponibilidad_producto_publica`) + variantes hermanas (si `variante_grupo_id` no es null, todas las filas con ese mismo grupo, ordenadas por `variante_orden`) + productos similares (misma categoría O primera palabra del nombre coincide, excluyendo las variantes del propio producto y colapsando por grupo igual que el catálogo). `ProductoDetalleClient.tsx` (client) muestra: imagen con hover, categoría, precio, **selector de variantes** (si hay más de una, botones tipo pastilla con la etiqueta de cada una — clic navega a `/producto/[id]` de esa variante, cada una con su propio precio/stock/imagen), disponibilidad por sucursal + total, selector de cantidad (clamped a la existencia total), "Agregar al carrito", descripción, especificaciones (código + categoría), y al final "Productos similares".
- **Carrito de compra + checkout por WhatsApp** — botón "Agregar al carrito" en cada tarjeta del catálogo, "Los más vendidos" y la página de producto. `CartContext` (`useCart()`) guarda los items en memoria (React Context) Y en `localStorage` (clave `fm_carrito`) — el `CartProvider` envuelve toda la app desde `src/app/layout.tsx`. `agregar(producto, cantidad?)` acepta una cantidad opcional (default 1) — la página de producto la usa para agregar varias unidades de una vez según el selector. El ícono 🛒 del header abre `CartDrawer`. **"Comprar por WhatsApp"** construye un mensaje con productos/cantidades/total y abre `https://wa.me/525534888324?text=...` — el número **55 3488 8324** en formato `52` + 10 dígitos (sin el `1` que algunas guías viejas piden para México, ya no es necesario). NO es un checkout real ni descuenta inventario; el carrito no se vacía solo al hacer clic (hay un botón "Vaciar carrito" manual). Además, **`WhatsAppFloatingButton`** (abajo a la derecha, en `/`, `/catalogo` y `/producto/[id]`) abre un chat directo de WhatsApp con un saludo genérico — todo el contacto del cliente (antes "Solicitar producto") se atiende por ahí.

## Lo que falta por construir
### Panel admin (Fase 3)
✅ Completo.

### Deploy (Fase 6)
- [ ] Subir a Vercel
- [ ] Configurar variables de entorno en Vercel
- [ ] Conectar dominio

## SQL pendiente de correr (página pública + imágenes)
`add-storage-imagenes-productos.sql`, `add-rls-solicitudes-web-publico.sql` y `add-rls-publico-pagina-web.sql` ya se corrieron y se verificaron con pruebas reales (catálogo público legible por `anon` con columnas sensibles bloqueadas, bucket de imágenes existente, e INSERT público funcionando — el primer intento de verificación de `solicitudes_web_insert_publico` dio un falso positivo de error porque la prueba pedía `Prefer: return=representation`, que requiere una política de SELECT que `anon` no tiene a propósito; probar siempre con `return=minimal`, igual que hace `supabase-js` por default cuando no se encadena `.select()` después de `.insert()`).

`add-rls-solicitudes-web-update-admin.sql` también ya se corrió y se verificó con una sesión real de admin (cambio de estado exitoso) — sin esta política, `/admin/solicitudes` podía LEER las solicitudes pero no cambiarles el estado (no existía ninguna política de UPDATE para esta tabla, solo SELECT e INSERT).

`add-tabla-destacados.sql` también ya se corrió y se verificó end-to-end con una sesión real de admin (INSERT en `productos_destacados`) + lectura como `anon` + la landing realmente renderizando el producto — el primer intento de verificación mostró la sección vacía por el bug de caché de `fetch` ya documentado arriba, no por la tabla/política en sí.

`add-producto-detalle-publico.sql` (columnas `imagen_url_hover`/`descripcion` + grant a `anon` + función `disponibilidad_producto_publica`) también ya se corrió y se verificó con el catálogo público real (1376 productos, antes 0 por las columnas faltantes) y la página `/producto/[id]` mostrando disponibilidad por sucursal y productos similares.

`add-variantes-producto.sql` (columnas `variante_grupo_id`/`variante_nombre`/`variante_orden` + grant a `anon`) también ya se corrió, y ya se ejecutó `migrate-agrupar-variantes.mjs` sobre la base real — verificado con el catálogo (de 1376 a 1323 tarjetas, las variantes colapsadas) y con `/producto/[id]` de "Bota Neumática Walker" mostrando las 4 tallas en el selector.

No hay SQL pendiente de correr al momento de escribir esto.

## Notas importantes
- ⚠️ **Gotcha ya vivido — caché de `fetch` de Next.js servía datos viejos de Supabase**: `src/utils/supabase/server.ts` no le decía a Supabase qué `fetch` usar, así que tomaba el `fetch` global que Next.js parchea en App Router — y Next por default **cachea esas respuestas indefinidamente** (Data Cache), incluso en rutas dinámicas (`ƒ`). Se descubrió al verificar "Los más vendidos": la tabla `productos_destacados` estaba vacía cuando se corrió `npm run build`, el usuario agregó productos después desde `/admin/destacados`, y la landing seguía mostrando la sección vacía — confirmado con curl directo a la API de Supabase que los datos SÍ estaban ahí, solo que Next no los volvía a pedir. Fix: `server.ts` ahora pasa `global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }` a `createServerClient()` — aplica a TODO el proyecto (admin y público) porque todos usan este mismo helper, así que esto corrige la clase de bug en general, no solo en destacados. Si en el futuro se quiere cachear algo a propósito, hacerlo explícitamente por query (`.select(...)` con algún mecanismo propio), nunca depender del comportamiento default de Next.
- El límite de filas de Supabase API está configurado en 2000 (cambiado desde el dashboard) — es un tope duro del servidor, no se evita pidiendo un `.range()` más grande desde el código. Para tablas que puedan superar 2000 filas (ej. `inventario` con varias sucursales), usar `fetchTodasLasFilas()` en `src/utils/fetchTodasLasFilas.ts`, que pagina automáticamente.
- La carpeta `migrate-data/` contiene el Excel original de productos — no tocar
- Los archivos `migrate-productos.mjs`, `update-categorias.mjs` y `migrate-agrupar-variantes.mjs` son scripts de migración ya ejecutados — no volver a correr (`migrate-agrupar-variantes.mjs` además es idempotente-riesgoso: si se vuelve a correr generaría grupos NUEVOS con uuids distintos para los mismos productos, no detecta los que ya están agrupados)
- El usuario admin es fuerzamedicacoacalco@gmail.com con rol admin_general
- `sucursales.direccion`: Coacalco y Tultepec ya tienen su dirección real en texto (actualizada vía REST con service role, sin necesitar SQL — es un UPDATE de datos, no un cambio de esquema/RLS). **Sucursal X sigue en `'Por definir'`** en la base — en la UI se trata como "Próximamente" (ver `infoMapaSucursales` abajo), nunca se muestra el texto `'Por definir'` literal.
- **`src/app/components/sucursalesInfo.ts`** — el usuario pasó links de Google Maps (no direcciones en texto) para Coacalco y Tultepec. ⚠️ **Gotchas ya vividos, en orden**:
  1. Guardar solo coordenadas lat/lng (de `!3d!4d` en la URL — esas son las del marcador real, NO las de `@lat,lng,zoom` que solo son el centro del viewport) y armar el embed con `q=lat,lng` abre un **pin genérico sin nombre**, no el negocio.
  2. Cambiar a `q=<nombre del lugar>` (búsqueda de texto) funcionó para Tultepec (su nombre en Google incluye "Tultepec") pero **resolvió mal para Coacalco**, porque el nombre de ese lugar en Google es solo `..."Fuerza Medica"` sin ciudad — búsqueda de texto ambigua, Google puede devolver un resultado distinto.
  3. **Fix definitivo**: usar el **CID exacto del lugar** — el segundo hex de `!1s0x...:0x<CID_HEX>` en la URL de Google Maps, convertido a decimal (`BigInt('0x...').toString()`) — con `https://www.google.com/maps?cid=<decimal>&output=embed`. Confirmado con `curl -IL` que esto redirige (301) a `maps/embed?origin=mfe&pb=!1m3!3m2!1m1!4s<cid>`, es decir, Google lo resuelve anclado a ESE lugar exacto, sin ambigüedad de texto. `infoMapaSucursales` guarda `cidEmbed` (esta URL ya armada) y `urlCompleta` (el link ORIGINAL que pasó el usuario, usado tal cual en "Cómo llegar" — nunca reconstruir esa URL con coordenadas sueltas).
  Lección para la próxima sucursal: **siempre pedir el link de Google Maps del lugar real** (no una dirección en texto ni coordenadas aproximadas) y extraer el CID de ahí — es el único método que no depende de que el geocoder de Google adivine bien.
  Esta info vive **hardcodeada en este archivo**, no en la base de datos, porque agregar columnas a `sucursales` requeriría una migración SQL que este entorno no puede ejecutar directamente — para sucursales fijas que casi no cambian, hardcodear es más simple. `ordenarSucursales()` también vive aquí: fuerza el orden Coacalco → Tultepec → (cualquier otra) en las 3 páginas públicas, en vez de depender del orden de creación en la base. Tanto `/sucursales` como la landing y `SiteFooter` usan `infoMapaSucursales[s.nombre]` para decidir: si existe, muestran mapa+dirección+teléfono+"Cómo llegar"; si no, muestran "Próximamente" sin mapa.
- Antes de asumir valores permitidos en columnas con posible CHECK constraint (como `cotizaciones.estado` o `solicitudes_web.estado`), verificar contra la base real en vez de adivinar — ya pasó dos veces (primero con `'rechazada'`/`'cancelada'` en cotizaciones, luego con varios valores en `solicitudes_web.estado` hasta confirmar que solo `'pendiente'`/`'atendida'`/`'cancelada'` pasan el constraint)
- ⚠️ **Gotcha ya vivido**: `globals.css` tenía un bloque `@media (prefers-color-scheme: dark)` que cambiaba `--foreground` a un gris claro (`#ededed`) cuando el sistema operativo del visitante está en modo oscuro. Cualquier texto sin una clase de color explícita (Tailwind `text-*` o `style` inline) hereda `color: var(--foreground)` del `body` — en modo oscuro del sistema, ese texto casi blanco se volvía invisible sobre fondos claros/blancos. Pasó primero con inputs/selects (de ahí el `!important` ya existente en este archivo) y luego con texto normal de la página pública. Se quitó el bloque de modo oscuro por completo — este sitio no está diseñado para adaptarse a dark mode, usa colores fijos en todos lados (estilos en línea en admin, clases Tailwind explícitas en la página pública), así que no hay razón para dejar la variable flotando y heredándose por accidente.
- `src/utils/supabase/admin.ts` usa la service role key — **solo se importa desde route handlers (`src/app/api/.../route.ts`)**, nunca desde un componente cliente ni un componente que se renderice en el navegador. Cualquier acción privilegiada nueva (crear/banear usuarios, bypass de RLS) debe ir en una API route que primero llama a `requerirAdmin()`
- ⚠️ **Gotcha ya vivido**: `aplicarEdicionLote()` (`src/utils/aplicarEdicionLote.ts`) mandaba **una petición HTTP por fila, todas en paralelo con `Promise.all`**, cuando los valores nuevos difieren entre filas (ej. "Llenar stock al máximo", donde cada producto tiene su propio `inventario_maximo`). Con una edición en lote de los 1,376 productos esto saturaba el navegador/red y tronaba con `TypeError: Failed to fetch` en cuanto UNA petición fallaba — y como era `Promise.all`, esa sola falla cancelaba el reporte de las demás (aunque la mayoría sí se hubiera aplicado, sin que el usuario lo supiera). Fix: las peticiones van en lotes (100 ids por `.in()` cuando el valor es el mismo para todos; 50 peticiones concurrentes a la vez cuando el valor difiere por fila, usando `Promise.allSettled` para no abortar el conteo si alguna falla). Cualquier operación en lote nueva sobre selecciones grandes (miles de filas) debe pensar en este límite antes de mandar todo de golpe.

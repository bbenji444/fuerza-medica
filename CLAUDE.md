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
│   │   └── empleados/
│   │       ├── page.tsx          ← Lista de empleados (server component, solo admin_general)
│   │       └── EmpleadosTable.tsx ← CRUD de accesos (llama a /api/empleados)
│   ├── api/
│   │   └── empleados/
│   │       ├── route.ts          ← POST: crea usuario en Supabase Auth + fila en `usuarios`
│   │       └── [id]/route.ts     ← PATCH: editar datos, activar/desactivar, resetear contraseña
│   ├── login/
│   │   └── page.tsx              ← Pantalla de login (con logo)
│   ├── components/                ← Compartidos por la página pública (NO el admin, que usa estilos en línea)
│   │   ├── SiteHeader.tsx        ← Header público (logo, nav, menú hamburguesa en móvil) — client component
│   │   └── SiteFooter.tsx        ← Footer público (sucursales + navegación) — recibe `sucursales` como prop
│   ├── page.tsx                  ← Landing pública: hero, valores, categorías destacadas, sucursales, CTA
│   ├── catalogo/
│   │   ├── page.tsx              ← Server component: fetch productos/categorias/sucursales (rol anon)
│   │   ├── CatalogoClient.tsx    ← Búsqueda + filtro cascada categoría→subcategoría + scroll infinito (IntersectionObserver)
│   │   └── SolicitarProductoModal.tsx ← Formulario público (sin login) → INSERT en `solicitudes_web`
│   └── sucursales/
│       └── page.tsx              ← Tarjeta por sucursal con mapa embebido (iframe Google Maps, sin API key)
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
- **productos** — 1,376 productos con codigo, nombre, precio_costo, precio_venta, precio_mayoreo, categoria_id, activo, **imagen_url** (text, nullable — se llena desde `/admin/inventario`, botón "+ Imagen"/"Cambiar imagen"; se muestra en el catálogo público con placeholder ⚕️ si está vacío)
- **inventario** — Stock por sucursal (producto_id + sucursal_id + existencia + inventario_minimo + inventario_maximo). Las 3 sucursales tienen el mismo listado de productos replicado (pendiente que el usuario lo ajuste sucursal por sucursal)
- **usuarios** — admin_general + operadores por sucursal. Campo `rol` puede ser 'admin_general' o 'operador'. `id` es el mismo uuid que `auth.users.id` (no tiene default, se asigna al crear el usuario de Auth). Los empleados se crean desde `/admin/empleados`, que también crea el usuario de Supabase Auth correspondiente vía API route con service role
- **clientes** — Datos de clientes para cotizaciones/ventas (nombre, telefono, correo, direccion)
- **cotizaciones** — Cabecera (cliente_id, sucursal_id, usuario_id, estado, total). **`estado` tiene un CHECK constraint**: valores válidos son `'borrador'`, `'enviada'`, `'aceptada'`, `'cancelada'` (⚠️ NO `'rechazada'` — ese valor no pasa el constraint, ya se intentó y falla con error 23514)
- **cotizacion_items** — Detalle por cotización (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal generado)
- **ventas** — Cabecera (folio autogenerado tipo `V-0001` vía secuencia, sucursal_id, usuario_id, cliente_id nullable, metodo_pago, total, cotizacion_id nullable si vino de una conversión)
- **venta_items** — Detalle por venta (venta_id, producto_id, cantidad, precio_unitario, subtotal generado)
- **promociones** — Descuentos por producto o categoría (tipo: porcentaje/precio_fijo/precio_especial, valor, producto_id o categoria_id, activa, fecha_inicio/fecha_fin opcionales)
- **solicitudes_web** — Solicitudes desde la página pública (nombre_cliente, telefono, correo, producto_id, estado) — tabla existe, módulo de admin todavía no se construye

### Funciones SQL (RPC y helpers de RLS)
- **descontar_inventario(p_producto_id, p_sucursal_id, p_cantidad)** — UPDATE atómico condicional (`WHERE existencia >= p_cantidad`). Si no hay stock suficiente, **no actualiza nada y devuelve una fila con todos los campos en `null`** (no un `null` real — hay que revisar `data.id == null`, no `!data`). Usado al crear ventas y al convertir cotizaciones en ventas. **`security definer`** con chequeo explícito `es_admin() or p_sucursal_id = mi_sucursal()` dentro de la función (no puede depender de RLS de `inventario`, porque esa tabla solo permite UPDATE a admin — ver gotcha abajo).
- **incrementar_inventario(p_producto_id, p_sucursal_id, p_cantidad)** — mismo patrón, para devolver stock (rollback de ventas fallidas, o al borrar una venta).
- **es_admin()** — `security definer`, devuelve true si `auth.uid()` tiene `rol = 'admin_general'` en `usuarios`. Usado en políticas RLS para no depender de checks en el cliente.
- **mi_sucursal()** — `security definer`, devuelve el `sucursal_id` del usuario autenticado. Usado para que cada operador solo vea su propia sucursal.
- **disponibilidad_producto_otras_sucursales(p_producto_id, p_sucursal_actual)** — devuelve `(sucursal_nombre, existencia)` de un producto puntual en las DEMÁS sucursales (excluye `p_sucursal_actual`). `security definer` intencional: un operador no puede ver el inventario de otra sucursal por RLS, pero sí necesita saber "¿hay esto en otra sucursal?" al vender algo sin stock — esta función abre una rendija controlada (solo ese producto, solo nombre+existencia, nunca precios) sin tocar la política general de `inventario`. Usada en `VentaRapidaPanel` vía `useEffect` cuando un renglón del carrito tiene `existencia === 0` o `cantidad > existencia`.
- ⚠️ **Gotcha ya vivido**: si una función RPC necesita hacer un UPDATE/DELETE que un operador normal NO tendría permiso de hacer directamente vía RLS (como descontar stock al vender), la función **debe ser `security definer`** y validar el permiso ELLA MISMA (`es_admin()`/`mi_sucursal()`), porque si es `security invoker` (el default), corre con los permisos de quien la llama y RLS la bloquea en silencio — esto causó que cuentas de operador no pudieran completar ventas (la función fallaba sin error visible, devolviendo la fila con `null`, y la app lo interpretaba como "sin stock"). Antes de agregar cualquier RPC que toque tablas restringidas a admin, pensar si los operadores necesitan invocarla.

### Políticas RLS activas
La mayoría son para rol `authenticated` (panel admin). Las marcadas explícitamente `anon` son para la página web pública (sin login) — son políticas DISTINTAS y ADICIONALES, no reemplazan a las de `authenticated`.
- **productos**: SELECT abierto (`authenticated`); INSERT/UPDATE/DELETE solo `es_admin()`. **Para `anon`** (catálogo público): SELECT solo `activo = true`, y además **column-level grant restringido** (`grant select (id, codigo, nombre, precio_venta, categoria_id, imagen_url, activo, creado_en) on productos to anon`) — un visitante sin login JAMÁS puede leer `precio_costo` ni `precio_mayoreo` aunque la fila pase el RLS, porque ni siquiera tiene permiso de columna. ⚠️ Si se agrega un nuevo campo sensible a `productos`, hay que revisar si el grant de `anon` necesita actualizarse (por default Supabase otorga SELECT de TODA la tabla a `anon`, así que cualquier columna nueva queda expuesta a menos que se revoque explícitamente).
- **inventario**: SELECT solo `es_admin() or sucursal_id = mi_sucursal()`; INSERT/UPDATE/DELETE solo `es_admin()`. Sin política para `anon` — el catálogo público no expone existencias.
- **sucursales, categorias**: SELECT abierto para `authenticated` Y para `anon` (`categorias`: sin filtro; `sucursales`: solo `activa = true`) — usadas en filtros del catálogo, footer y `/sucursales`.
- **solicitudes_web**: SELECT abierto para `authenticated` (pendiente módulo de admin para verlas). **INSERT abierto para `anon`** (`with check (true)`) — es la única forma en que el formulario público de "Solicitar producto" puede escribir, ya que esos visitantes no tienen cuenta.
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

### Dashboard (`/admin`)
Ventas de hoy/mes (clicables → Reportes), cotizaciones pendientes (borrador + enviada), productos con stock bajo (**contando productos distintos**, no filas de inventario — un producto en 3 sucursales no debe contarse 3 veces), comparativo de ventas por sucursal y top 5 productos más vendidos del mes (gráficas con recharts). El nombre de producto en la gráfica horizontal se trunca a 26 caracteres con `tickFormatter` (los nombres reales de productos médicos son largos y se encimaban con el ancho de eje default de recharts) — el nombre completo sigue apareciendo en el tooltip al pasar el mouse.

## Página pública (sin login — `/`, `/catalogo`, `/sucursales`)
Usa Tailwind (a diferencia del admin, que usa estilos en línea) y los mismos colores navy/azul. `SiteHeader`/`SiteFooter` compartidos entre las 3 páginas. Todas son `async` server components que llaman `createClient()` de `@/utils/supabase/server` **sin** pasar por `obtenerUsuarioActual()` (no hay sesión que verificar, y nunca se debe redirigir a `/login` desde aquí). El middleware (`middleware.ts`) solo protege rutas que empiecen con `/admin`, así que estas páginas no se ven afectadas.
- **Landing (`/`)** — hero con logo + CTA, 3 tarjetas de valores, grid de las 12 categorías principales (`categoria_padre is null`) enlazando a `/catalogo?categoria=ID`, 3 tarjetas de sucursales, CTA final, footer.
- **Catálogo (`/catalogo`)** — `page.tsx` trae TODOS los productos activos en una sola query (igual al patrón ya usado en Cotizaciones/Ventas: 1,376 filas no amerita paginar en servidor) y los pasa a `CatalogoClient` (client component), que filtra en memoria: buscador (nombre/código) + cascada categoría→subcategoría (mismo patrón que `/admin/inventario`). **Scroll infinito** vía `IntersectionObserver` sobre un `div` centinela al final de la grilla (lotes de 24, `rootMargin: '400px'` para precargar antes de que el usuario llegue al fondo) — no hay paginación con botones ni con parámetros de URL. Usa `next/image` con el dominio de Supabase Storage agregado a `images.remotePatterns` en `next.config.ts`; si `imagen_url` es null muestra un emoji ⚕️ como placeholder (no hay archivo de imagen placeholder real). Cada tarjeta tiene un botón "Solicitar" que abre `SolicitarProductoModal`.
- **Solicitar producto** (`SolicitarProductoModal.tsx`) — formulario (nombre, teléfono, correo opcional, sucursal de preferencia, comentarios opcionales) que hace `insert` directo a `solicitudes_web` con el cliente de navegador (`@/utils/supabase/client`) usando el rol `anon` — requiere la policy `solicitudes_web_insert_publico`. Guarda `producto_id` (el producto desde el que se abrió el modal) y `estado: 'pendiente'`. Muestra una confirmación inline (✅) en vez de cerrar el modal solo, para que el visitante sepa que sí se envió.
- **Sucursales (`/sucursales`)** — tarjeta por sucursal con mapa embebido (`iframe` a `google.com/maps?q=...&output=embed`, sin necesitar API key de Google Maps) + dirección + teléfono (`tel:` link) + botón "Cómo llegar" (abre Google Maps en pestaña nueva). El horario ("Lunes a sábado 9:00-19:00 hrs") está fijo en el código — `sucursales` no tiene columna de horario en la base; si el negocio empieza a variar horarios por sucursal, agregar la columna en vez de seguir hardcodeando.
- **Pendiente, no construido**: módulo de admin para ver/atender las filas de `solicitudes_web` que llegan del formulario público (el INSERT público ya funciona; falta la vista de administración — ver "Lo que falta por construir").

## Lo que falta por construir
### Panel admin (Fase 3)
- [ ] Solicitudes web — ver y atender solicitudes desde la página pública (el formulario público que las crea ya está construido, ver sección "Página pública")

### Deploy (Fase 6)
- [ ] Subir a Vercel
- [ ] Configurar variables de entorno en Vercel
- [ ] Conectar dominio

## SQL pendiente de correr (página pública + imágenes)
Estos 3 archivos se escribieron en esta sesión y **no pude ejecutarlos yo mismo** (no hay conexión directa a Postgres ni Management API disponible en este entorno, solo la URL REST + las API keys) — hay que correrlos en el SQL Editor de Supabase antes de que la página pública y la carga de imágenes funcionen de verdad:
1. `add-storage-imagenes-productos.sql` — bucket `productos` + políticas de Storage
2. `add-rls-solicitudes-web-publico.sql` — permite el INSERT público del formulario "Solicitar producto"
3. `add-rls-publico-pagina-web.sql` — el más importante: sin este, `/`, `/catalogo` y `/sucursales` cargan pero se ven completamente vacíos (categorías, sucursales y productos en 0), porque las tablas no eran legibles por `anon` hasta ahora
Después de correrlos, probar `/catalogo` y el formulario de "Solicitar" en un navegador normal (sin sesión iniciada) para confirmar que de verdad funcionan sin login.

## Notas importantes
- El límite de filas de Supabase API está configurado en 2000 (cambiado desde el dashboard) — es un tope duro del servidor, no se evita pidiendo un `.range()` más grande desde el código. Para tablas que puedan superar 2000 filas (ej. `inventario` con varias sucursales), usar `fetchTodasLasFilas()` en `src/utils/fetchTodasLasFilas.ts`, que pagina automáticamente.
- La carpeta `migrate-data/` contiene el Excel original de productos — no tocar
- Los archivos `migrate-productos.mjs` y `update-categorias.mjs` son scripts de migración ya ejecutados — no volver a correr
- El usuario admin es fuerzamedicacoacalco@gmail.com con rol admin_general
- Antes de asumir valores permitidos en columnas con posible CHECK constraint (como `cotizaciones.estado`), verificar contra la base real en vez de adivinar — ya pasó una vez que se asumió `'rechazada'` cuando el valor correcto era `'cancelada'`
- `src/utils/supabase/admin.ts` usa la service role key — **solo se importa desde route handlers (`src/app/api/.../route.ts`)**, nunca desde un componente cliente ni un componente que se renderice en el navegador. Cualquier acción privilegiada nueva (crear/banear usuarios, bypass de RLS) debe ir en una API route que primero llama a `requerirAdmin()`
- ⚠️ **Gotcha ya vivido**: `aplicarEdicionLote()` (`src/utils/aplicarEdicionLote.ts`) mandaba **una petición HTTP por fila, todas en paralelo con `Promise.all`**, cuando los valores nuevos difieren entre filas (ej. "Llenar stock al máximo", donde cada producto tiene su propio `inventario_maximo`). Con una edición en lote de los 1,376 productos esto saturaba el navegador/red y tronaba con `TypeError: Failed to fetch` en cuanto UNA petición fallaba — y como era `Promise.all`, esa sola falla cancelaba el reporte de las demás (aunque la mayoría sí se hubiera aplicado, sin que el usuario lo supiera). Fix: las peticiones van en lotes (100 ids por `.in()` cuando el valor es el mismo para todos; 50 peticiones concurrentes a la vez cuando el valor difiere por fila, usando `Promise.allSettled` para no abortar el conteo si alguna falla). Cualquier operación en lote nueva sobre selecciones grandes (miles de filas) debe pensar en este límite antes de mandar todo de golpe.

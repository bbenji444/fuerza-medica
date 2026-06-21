-- Módulo de Empleados: control de acceso por rol y por sucursal
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)
--
-- Reemplaza TODAS las políticas existentes en las tablas listadas abajo (se borran
-- dinámicamente sin importar su nombre actual, para no dejar políticas viejas y
-- nuevas activas al mismo tiempo) y las recrea con las reglas:
--   - admin_general: ve y administra todo, sin restricción de sucursal
--   - operador: solo ve/opera su propia sucursal; no puede editar productos/inventario
--     ni administrar promociones

-- 1) Funciones auxiliares (security definer: evitan recursión de RLS sobre "usuarios")
create or replace function es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and rol = 'admin_general'
  );
$$;

create or replace function mi_sucursal()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select sucursal_id from usuarios where id = auth.uid();
$$;

grant execute on function es_admin() to authenticated;
grant execute on function mi_sucursal() to authenticated;

-- 2) Helper: borra todas las políticas de una tabla sin importar su nombre
create or replace function _borrar_politicas(p_tabla text)
returns void
language plpgsql
as $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = p_tabla loop
    execute format('drop policy %I on %I', pol.policyname, p_tabla);
  end loop;
end;
$$;

-- 3) usuarios: cada uno ve su propia fila; admin_general ve todas
alter table usuarios enable row level security;
select _borrar_politicas('usuarios');

create policy "usuarios_select"
  on usuarios for select
  to authenticated
  using (auth.uid() = id or es_admin());

-- 4) productos: todos ven, solo admin edita
alter table productos enable row level security;
select _borrar_politicas('productos');

create policy "productos_select"
  on productos for select to authenticated using (true);

create policy "productos_update_admin"
  on productos for update to authenticated
  using (es_admin()) with check (es_admin());

-- 5) inventario: cada uno ve solo su sucursal (admin ve todas); solo admin edita
alter table inventario enable row level security;
select _borrar_politicas('inventario');

create policy "inventario_select_sucursal"
  on inventario for select to authenticated
  using (es_admin() or sucursal_id = mi_sucursal());

create policy "inventario_update_admin"
  on inventario for update to authenticated
  using (es_admin()) with check (es_admin());

-- 6) clientes: sin restricción de sucursal (un cliente puede comprar en cualquier sucursal)
alter table clientes enable row level security;
select _borrar_politicas('clientes');

create policy "clientes_select" on clientes for select to authenticated using (true);
create policy "clientes_insert" on clientes for insert to authenticated with check (true);
create policy "clientes_update" on clientes for update to authenticated using (true) with check (true);
create policy "clientes_delete" on clientes for delete to authenticated using (true);

-- 7) cotizaciones: cada uno ve/crea/edita/borra solo en su sucursal (admin ve todas)
alter table cotizaciones enable row level security;
select _borrar_politicas('cotizaciones');

create policy "cotizaciones_select_sucursal"
  on cotizaciones for select to authenticated
  using (es_admin() or sucursal_id = mi_sucursal());

create policy "cotizaciones_insert_sucursal"
  on cotizaciones for insert to authenticated
  with check (es_admin() or sucursal_id = mi_sucursal());

create policy "cotizaciones_update_sucursal"
  on cotizaciones for update to authenticated
  using (es_admin() or sucursal_id = mi_sucursal())
  with check (es_admin() or sucursal_id = mi_sucursal());

create policy "cotizaciones_delete_sucursal"
  on cotizaciones for delete to authenticated
  using (es_admin() or sucursal_id = mi_sucursal());

-- 8) cotizacion_items: heredan el alcance de su cotización
alter table cotizacion_items enable row level security;
select _borrar_politicas('cotizacion_items');

create policy "cotizacion_items_select_sucursal"
  on cotizacion_items for select to authenticated
  using (
    es_admin() or exists (
      select 1 from cotizaciones c
      where c.id = cotizacion_items.cotizacion_id and c.sucursal_id = mi_sucursal()
    )
  );

create policy "cotizacion_items_insert_sucursal"
  on cotizacion_items for insert to authenticated
  with check (
    es_admin() or exists (
      select 1 from cotizaciones c
      where c.id = cotizacion_items.cotizacion_id and c.sucursal_id = mi_sucursal()
    )
  );

create policy "cotizacion_items_delete_sucursal"
  on cotizacion_items for delete to authenticated
  using (
    es_admin() or exists (
      select 1 from cotizaciones c
      where c.id = cotizacion_items.cotizacion_id and c.sucursal_id = mi_sucursal()
    )
  );

-- 9) ventas: mismo patrón que cotizaciones
alter table ventas enable row level security;
select _borrar_politicas('ventas');

create policy "ventas_select_sucursal"
  on ventas for select to authenticated
  using (es_admin() or sucursal_id = mi_sucursal());

create policy "ventas_insert_sucursal"
  on ventas for insert to authenticated
  with check (es_admin() or sucursal_id = mi_sucursal());

create policy "ventas_delete_sucursal"
  on ventas for delete to authenticated
  using (es_admin() or sucursal_id = mi_sucursal());

-- 10) venta_items: heredan el alcance de su venta
alter table venta_items enable row level security;
select _borrar_politicas('venta_items');

create policy "venta_items_select_sucursal"
  on venta_items for select to authenticated
  using (
    es_admin() or exists (
      select 1 from ventas v
      where v.id = venta_items.venta_id and v.sucursal_id = mi_sucursal()
    )
  );

create policy "venta_items_insert_sucursal"
  on venta_items for insert to authenticated
  with check (
    es_admin() or exists (
      select 1 from ventas v
      where v.id = venta_items.venta_id and v.sucursal_id = mi_sucursal()
    )
  );

create policy "venta_items_delete_sucursal"
  on venta_items for delete to authenticated
  using (
    es_admin() or exists (
      select 1 from ventas v
      where v.id = venta_items.venta_id and v.sucursal_id = mi_sucursal()
    )
  );

-- 11) promociones: todos ven (para aplicar descuentos al cotizar/vender), solo admin administra
alter table promociones enable row level security;
select _borrar_politicas('promociones');

create policy "promociones_select" on promociones for select to authenticated using (true);
create policy "promociones_insert_admin" on promociones for insert to authenticated with check (es_admin());
create policy "promociones_update_admin" on promociones for update to authenticated using (es_admin()) with check (es_admin());
create policy "promociones_delete_admin" on promociones for delete to authenticated using (es_admin());

-- 12) limpieza: ya no se necesita el helper de borrado dinámico
drop function _borrar_politicas(text);

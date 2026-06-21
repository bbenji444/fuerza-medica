-- Configuración general de la tienda: margen de ganancia e IVA por default
-- para la calculadora de precio en Ventas.
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

create table if not exists configuracion (
  id uuid primary key default extensions.uuid_generate_v4(),
  margen_ganancia numeric not null default 70,
  iva_porcentaje numeric not null default 16,
  actualizado_en timestamptz not null default now()
);

insert into configuracion (margen_ganancia, iva_porcentaje)
select 70, 16
where not exists (select 1 from configuracion);

alter table configuracion enable row level security;

drop policy if exists "configuracion_select" on configuracion;
create policy "configuracion_select"
  on configuracion for select
  to authenticated
  using (true);

drop policy if exists "configuracion_update_admin" on configuracion;
create policy "configuracion_update_admin"
  on configuracion for update
  to authenticated
  using (es_admin())
  with check (es_admin());

-- Módulo de Caja (apertura/cierre con conteo físico) + Pagos mixtos en Ventas
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

-- 1) Tabla cortes_caja: una "caja abierta" por sucursal a la vez (índice único parcial)
create table if not exists cortes_caja (
  id uuid primary key default extensions.uuid_generate_v4(),
  sucursal_id uuid not null references sucursales(id),
  usuario_apertura_id uuid references usuarios(id),
  fondo_inicial numeric not null default 0,
  abierto_en timestamptz not null default now(),
  estado text not null default 'abierto' check (estado in ('abierto', 'cerrado')),
  usuario_cierre_id uuid references usuarios(id),
  efectivo_esperado numeric,
  efectivo_contado numeric,
  diferencia numeric,
  cerrado_en timestamptz,
  notas text
);

create unique index if not exists cortes_caja_un_abierto_por_sucursal
  on cortes_caja (sucursal_id)
  where estado = 'abierto';

alter table cortes_caja enable row level security;

drop policy if exists "cortes_caja_select_sucursal" on cortes_caja;
create policy "cortes_caja_select_sucursal"
  on cortes_caja for select to authenticated
  using (es_admin() or sucursal_id = mi_sucursal());

drop policy if exists "cortes_caja_insert_sucursal" on cortes_caja;
create policy "cortes_caja_insert_sucursal"
  on cortes_caja for insert to authenticated
  with check (es_admin() or sucursal_id = mi_sucursal());

drop policy if exists "cortes_caja_update_sucursal" on cortes_caja;
create policy "cortes_caja_update_sucursal"
  on cortes_caja for update to authenticated
  using (es_admin() or sucursal_id = mi_sucursal())
  with check (es_admin() or sucursal_id = mi_sucursal());

drop policy if exists "cortes_caja_delete_admin" on cortes_caja;
create policy "cortes_caja_delete_admin"
  on cortes_caja for delete to authenticated
  using (es_admin());

-- 2) Pagos mixtos en ventas: desglose por método + datos de cambio en efectivo
alter table ventas add column if not exists corte_caja_id uuid references cortes_caja(id);
alter table ventas add column if not exists monto_efectivo numeric not null default 0;
alter table ventas add column if not exists monto_tarjeta numeric not null default 0;
alter table ventas add column if not exists monto_transferencia numeric not null default 0;
alter table ventas add column if not exists monto_recibido_efectivo numeric;
alter table ventas add column if not exists cambio numeric not null default 0;

-- Backfill de ventas ya existentes (metodo_pago era un solo valor: todo el total fue por ese método)
update ventas set monto_efectivo = total
  where metodo_pago = 'efectivo' and monto_efectivo = 0 and monto_tarjeta = 0 and monto_transferencia = 0;
update ventas set monto_tarjeta = total
  where metodo_pago = 'tarjeta' and monto_efectivo = 0 and monto_tarjeta = 0 and monto_transferencia = 0;
update ventas set monto_transferencia = total
  where metodo_pago = 'transferencia' and monto_efectivo = 0 and monto_tarjeta = 0 and monto_transferencia = 0;

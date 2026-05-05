-- ============================================================
-- THROUGHPUT OS — Initial Schema
-- Teoria das Restrições (TOC) — Goldratt
-- Migration: 20260505000001_initial_schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: skus
-- ============================================================
create table if not exists public.skus (
  id                uuid primary key default uuid_generate_v4(),
  sku_code          text not null unique,
  product_name      text not null,
  category          text not null default '',
  family            text not null default '',
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.skus is 'Catálogo de produtos/SKUs do sistema';
comment on column public.skus.sku_code is 'Código único do SKU (ex: SKU-001)';
comment on column public.skus.family is 'Família de produto — usada para agrupar etapas de produção';

-- ============================================================
-- TABLE: sales
-- ============================================================
create table if not exists public.sales (
  id                uuid primary key default uuid_generate_v4(),
  sku_id            uuid not null references public.skus(id) on delete cascade,
  date              date not null,
  channel           text not null default 'direto',
  quantity          integer not null check (quantity > 0),
  unit_price        numeric(12,2) not null check (unit_price >= 0),
  gross_revenue     numeric(12,2) not null check (gross_revenue >= 0),
  fees              numeric(12,2) not null default 0 check (fees >= 0),
  freight           numeric(12,2) not null default 0 check (freight >= 0),
  tax               numeric(12,2) not null default 0 check (tax >= 0),
  net_revenue       numeric(12,2) generated always as (gross_revenue - fees - freight - tax) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.sales is 'Registro de vendas por SKU — base do cálculo de Ganho (Throughput)';
comment on column public.sales.net_revenue is 'Receita líquida calculada automaticamente: gross_revenue - fees - freight - tax';

-- ============================================================
-- TABLE: costs
-- ============================================================
create table if not exists public.costs (
  id                    uuid primary key default uuid_generate_v4(),
  sku_id                uuid not null references public.skus(id) on delete cascade,
  material_cost         numeric(12,2) not null default 0 check (material_cost >= 0),
  packaging_cost        numeric(12,2) not null default 0 check (packaging_cost >= 0),
  variable_cost_total   numeric(12,2) generated always as (material_cost + packaging_cost) stored,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint costs_sku_unique unique (sku_id)
);

comment on table public.costs is 'Custos variáveis por SKU — base do cálculo de Ganho Unitário (T = net_revenue - variable_cost_total)';
comment on column public.costs.variable_cost_total is 'Custo variável total calculado: material_cost + packaging_cost';

-- ============================================================
-- TABLE: inventory
-- ============================================================
create table if not exists public.inventory (
  id                  uuid primary key default uuid_generate_v4(),
  sku_id              uuid not null references public.skus(id) on delete cascade,
  stock_raw           integer not null default 0 check (stock_raw >= 0),
  stock_semi          integer not null default 0 check (stock_semi >= 0),
  stock_finished      integer not null default 0 check (stock_finished >= 0),
  stock_marketplace   integer not null default 0 check (stock_marketplace >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint inventory_sku_unique unique (sku_id)
);

comment on table public.inventory is 'Posição de estoque por SKU em cada etapa — representa o Inventário (I) da TOC';

-- ============================================================
-- TABLE: production_steps
-- ============================================================
create table if not exists public.production_steps (
  id            uuid primary key default uuid_generate_v4(),
  sku_family    text not null,
  step_name     text not null,
  time_seconds  integer not null check (time_seconds > 0),
  operators     integer not null default 1 check (operators > 0),
  machines      integer not null default 1 check (machines > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint production_steps_family_step_unique unique (sku_family, step_name)
);

comment on table public.production_steps is 'Etapas de produção por família de SKU — usado para identificar o Gargalo (Restrição)';
comment on column public.production_steps.time_seconds is 'Tempo de ciclo em segundos por unidade produzida';

-- ============================================================
-- TABLE: decisions
-- ============================================================
create table if not exists public.decisions (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null default current_date,
  action          text not null,
  sku_id          uuid references public.skus(id) on delete set null,
  expected_gain   numeric(12,2) not null default 0,
  reason          text not null default '',
  status          text not null default 'pending' check (status in ('pending', 'executed', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.decisions is 'Registro de decisões geradas pelo Decision Engine — rastreabilidade das ações';
comment on column public.decisions.status is 'pending | executed | cancelled';

-- ============================================================
-- INDEXES — Otimizados para os padrões de acesso do sistema
-- ============================================================

-- Sales: consultas por período e canal (módulo Sales Intelligence)
create index if not exists idx_sales_sku_id      on public.sales(sku_id);
create index if not exists idx_sales_date        on public.sales(date desc);
create index if not exists idx_sales_channel     on public.sales(channel);
create index if not exists idx_sales_sku_date    on public.sales(sku_id, date desc);

-- Inventory: lookup por SKU (módulo Inventory Control)
create index if not exists idx_inventory_sku_id  on public.inventory(sku_id);

-- Costs: lookup por SKU (cálculo de throughput)
create index if not exists idx_costs_sku_id      on public.costs(sku_id);

-- Production: busca por família (módulo Production Flow)
create index if not exists idx_production_family on public.production_steps(sku_family);

-- Decisions: consultas por data e status (módulo Execution Dashboard)
create index if not exists idx_decisions_date    on public.decisions(date desc);
create index if not exists idx_decisions_status  on public.decisions(status);
create index if not exists idx_decisions_sku_id  on public.decisions(sku_id);

-- SKUs: busca por categoria e família
create index if not exists idx_skus_category     on public.skus(category);
create index if not exists idx_skus_family       on public.skus(family);
create index if not exists idx_skus_active       on public.skus(active) where active = true;

-- ============================================================
-- AUTO-UPDATE: updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_skus
  before update on public.skus
  for each row execute function public.set_updated_at();

create trigger set_updated_at_sales
  before update on public.sales
  for each row execute function public.set_updated_at();

create trigger set_updated_at_costs
  before update on public.costs
  for each row execute function public.set_updated_at();

create trigger set_updated_at_inventory
  before update on public.inventory
  for each row execute function public.set_updated_at();

create trigger set_updated_at_production_steps
  before update on public.production_steps
  for each row execute function public.set_updated_at();

create trigger set_updated_at_decisions
  before update on public.decisions
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.skus             enable row level security;
alter table public.sales            enable row level security;
alter table public.costs            enable row level security;
alter table public.inventory        enable row level security;
alter table public.production_steps enable row level security;
alter table public.decisions        enable row level security;

-- Políticas: acesso autenticado total (fase inicial — sem multi-tenant)
-- TODO: restringir por organização quando multi-tenant for necessário

create policy "authenticated_full_access_skus"
  on public.skus for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_sales"
  on public.sales for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_costs"
  on public.costs for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_inventory"
  on public.inventory for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_production_steps"
  on public.production_steps for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_decisions"
  on public.decisions for all
  to authenticated
  using (true)
  with check (true);

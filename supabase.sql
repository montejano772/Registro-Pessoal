create extension if not exists pgcrypto;

create table if not exists public.partidas (
  id uuid primary key default gen_random_uuid(),
  codigo_sala text unique not null,
  nome text,
  host_jogador_id uuid,
  status text not null default 'aguardando' check (status in ('aguardando', 'em_andamento', 'finalizada')),
  tempo_inicial integer not null default 60,
  regra_silaba text not null default 'comeca_com' check (regra_silaba in ('comeca_com', 'contem')),
  modo_fim_jogo text not null default 'eliminacao' check (modo_fim_jogo in ('primeiro_eliminado', 'eliminacao')),
  rodada_atual integer not null default 1,
  silaba_atual text not null default '',
  jogador_atual_id uuid,
  turno_iniciado_em timestamptz,
  quantidade_maxima_jogadores integer not null default 6,
  vencedor_jogador_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jogadores (
  id uuid primary key default gen_random_uuid(),
  partida_id uuid not null references public.partidas(id) on delete cascade,
  nome text not null,
  tempo_restante integer not null,
  ordem integer not null,
  eliminado boolean not null default false,
  is_host boolean not null default false,
  conectado boolean not null default true,
  respondeu_rodada_atual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partidas
  add constraint partidas_host_jogador_id_fkey
  foreign key (host_jogador_id) references public.jogadores(id) on delete set null;

alter table public.partidas
  add constraint partidas_jogador_atual_id_fkey
  foreign key (jogador_atual_id) references public.jogadores(id) on delete set null;

alter table public.partidas
  add constraint partidas_vencedor_jogador_id_fkey
  foreign key (vencedor_jogador_id) references public.jogadores(id) on delete set null;

create table if not exists public.palavras_usadas (
  id uuid primary key default gen_random_uuid(),
  partida_id uuid not null references public.partidas(id) on delete cascade,
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  palavra text not null,
  palavra_normalizada text not null,
  silaba text not null,
  rodada integer not null,
  tempo_gasto integer not null,
  created_at timestamptz not null default now(),
  unique (partida_id, palavra_normalizada)
);

create index if not exists partidas_codigo_sala_idx on public.partidas(codigo_sala);
create index if not exists jogadores_partida_id_idx on public.jogadores(partida_id);
create index if not exists palavras_usadas_partida_id_idx on public.palavras_usadas(partida_id);
create index if not exists palavras_usadas_palavra_normalizada_idx on public.palavras_usadas(palavra_normalizada);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists partidas_set_updated_at on public.partidas;
create trigger partidas_set_updated_at
before update on public.partidas
for each row execute function public.set_updated_at();

drop trigger if exists jogadores_set_updated_at on public.jogadores;
create trigger jogadores_set_updated_at
before update on public.jogadores
for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.partidas;
alter publication supabase_realtime add table public.jogadores;
alter publication supabase_realtime add table public.palavras_usadas;

alter table public.partidas enable row level security;
alter table public.jogadores enable row level security;
alter table public.palavras_usadas enable row level security;

-- Primeira versao: politicas abertas para salas por codigo usando a anon key.
-- Para producao, mova as regras sensiveis para RPCs SECURITY DEFINER.
create policy "partidas_select_all" on public.partidas for select using (true);
create policy "partidas_insert_all" on public.partidas for insert with check (true);
create policy "partidas_update_all" on public.partidas for update using (true) with check (true);

create policy "jogadores_select_all" on public.jogadores for select using (true);
create policy "jogadores_insert_all" on public.jogadores for insert with check (true);
create policy "jogadores_update_all" on public.jogadores for update using (true) with check (true);

create policy "palavras_select_all" on public.palavras_usadas for select using (true);
create policy "palavras_insert_all" on public.palavras_usadas for insert with check (true);
create policy "palavras_delete_all" on public.palavras_usadas for delete using (true);

alter table public.partidas
  add column if not exists tipo_tempo text not null default 'individual';

alter table public.partidas
  add column if not exists tempo_compartilhado_restante integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partidas_tipo_tempo_check'
      and conrelid = 'public.partidas'::regclass
  ) then
    alter table public.partidas
      add constraint partidas_tipo_tempo_check
      check (tipo_tempo in ('individual', 'compartilhado'));
  end if;
end $$;

update public.partidas
set tipo_tempo = 'individual'
where tipo_tempo is null;

update public.partidas
set tempo_compartilhado_restante = tempo_inicial
where tipo_tempo = 'compartilhado'
  and tempo_compartilhado_restante is null;

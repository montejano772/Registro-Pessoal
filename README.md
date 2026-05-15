# BombQuiz

BombQuiz e um jogo multiplayer de palavras em portugues inspirado em batata quente, com tempo individual por jogador. A primeira versao permite criar sala, entrar por codigo, lobby realtime, iniciar partida, validar palavras, bloquear repetidas, controlar turnos e finalizar com ranking.

## Tecnologias

- Next.js + React + TypeScript
- Supabase Database + Realtime
- PWA com manifest e service worker
- Deploy preparado para Vercel

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

3. No Supabase, abra o SQL Editor e execute `supabase.sql`.

4. Rode o app:

```bash
npm run dev
```

5. Abra `http://localhost:3000` em dois celulares ou navegadores na mesma rede. Crie uma sala em um dispositivo e entre pelo codigo numerico no outro.

## Configurando Supabase

1. Crie um projeto no Supabase.
2. Copie `Project URL` e `anon public key` em Project Settings > API.
3. Execute o arquivo `supabase.sql`.
4. Confirme que Realtime esta ativo para `partidas`, `jogadores` e `palavras_usadas`.

O SQL cria:

- `partidas`
- `jogadores`
- `palavras_usadas`
- indices principais
- constraint `unique(partida_id, palavra_normalizada)`
- triggers de `updated_at`
- politicas RLS abertas para a primeira versao

## Deploy na Vercel

1. Suba o projeto para um repositorio Git.
2. Importe o repositorio na Vercel.
3. Configure as variaveis:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

4. Faça deploy.

## Estrutura

```text
src/
  app/
  components/
  data/
  lib/
  styles/
  types/
public/
supabase.sql
```

## Observacoes importantes

- O tempo oficial fica em `jogadores.tempo_restante`.
- O inicio do turno fica em `partidas.turno_iniciado_em`.
- O front calcula o cronometro visualmente, mas o desconto e salvo no Supabase quando o jogador responde.
- Palavras invalidas nao passam o turno.
- Palavras repetidas sao bloqueadas tambem por constraint no banco.
- Para uma versao de producao mais segura, a resposta do turno deve migrar para uma RPC no Supabase, validando jogador atual, tempo e palavra no backend.

## Atualizar lista de palavras

O projeto inclui um importador para gerar `src/data/palavras.json` a partir de uma lista pt-BR maior:

```bash
npm run importar:palavras
```

A fonte e os filtros aplicados ficam documentados em `src/data/palavras-fonte.md`.

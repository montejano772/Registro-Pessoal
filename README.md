# Caderno Pessoal

PWA offline para controle simples de entradas e saidas.

## Como funciona

- Dados financeiros ficam no aparelho, em IndexedDB.
- O site hospedado entrega apenas os arquivos do app.
- Nao usa login, API externa, analytics ou banco online.
- Backup pode ser exportado em JSON ou criptografado com senha.

## Instalar no iPhone

1. Abrir o link no Safari.
2. Tocar em Compartilhar.
3. Tocar em Adicionar a Tela de Inicio.

## Arquivos

- `index.html`: estrutura do app.
- `style.css`: visual responsivo.
- `app.js`: banco local, lancamentos, relatorios, importacao e backup.
- `manifest.json`: instalacao como PWA.
- `service-worker.js`: cache offline.

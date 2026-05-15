# Fonte das palavras

Arquivo gerado por `npm run importar:palavras`.

Fonte: https://github.com/pythonprobr/palavras

A lista original declara licença MPL-2.0 e informa que o arquivo `palavras.txt` contém mais de 320.000 palavras do português brasileiro, com fonte principal no dicionário pt-BR do LibreOffice.

Filtro aplicado para o jogo:

- remove abreviações, nomes próprios com inicial maiúscula e termos compostos com hífen
- mantém apenas palavras com 3 a 24 letras
- mantém acentos, porque o jogo normaliza a entrada antes de validar

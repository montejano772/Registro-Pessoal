import { writeFile } from "node:fs/promises";

const fonte = "https://raw.githubusercontent.com/pythonprobr/palavras/master/palavras.txt";
const destino = new URL("../src/data/palavras.json", import.meta.url);
const destinoInfo = new URL("../src/data/palavras-fonte.md", import.meta.url);

function normalizarToken(token) {
  return token.trim().toLocaleLowerCase("pt-BR");
}

function ehPalavraJogavel(tokenOriginal) {
  const token = tokenOriginal.trim();

  if (token.length < 3 || token.length > 24) return false;
  if (/[A-Z]/.test(token)) return false;
  if (token.includes("-") || token.includes("'") || token.includes(".")) return false;

  return /^[a-záàâãéèêíìîóòôõúùûç]+$/i.test(token);
}

const resposta = await fetch(fonte);

if (!resposta.ok) {
  throw new Error(`Falha ao baixar lista de palavras: ${resposta.status} ${resposta.statusText}`);
}

const texto = await resposta.text();
const palavras = [...new Set(texto.split(/\s+/).filter(ehPalavraJogavel).map(normalizarToken))].sort((a, b) =>
  a.localeCompare(b, "pt-BR")
);

await writeFile(destino, `${JSON.stringify(palavras, null, 2)}\n`, "utf8");
await writeFile(
  destinoInfo,
  `# Fonte das palavras\n\n` +
    `Arquivo gerado por \`npm run importar:palavras\`.\n\n` +
    `Fonte: https://github.com/pythonprobr/palavras\n\n` +
    `A lista original declara licença MPL-2.0 e informa que o arquivo \`palavras.txt\` contém mais de 320.000 palavras do português brasileiro, com fonte principal no dicionário pt-BR do LibreOffice.\n\n` +
    `Filtro aplicado para o jogo:\n\n` +
    `- remove abreviações, nomes próprios com inicial maiúscula e termos compostos com hífen\n` +
    `- mantém apenas palavras com 3 a 24 letras\n` +
    `- mantém acentos, porque o jogo normaliza a entrada antes de validar\n`,
  "utf8"
);

console.log(`Geradas ${palavras.length} palavras em ${destino.pathname}`);

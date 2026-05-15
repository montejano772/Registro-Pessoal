import { readFile, writeFile } from "node:fs/promises";

const fonteLocal = new URL("../palavras.txt", import.meta.url);
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

  return /^[a-z\u00e1\u00e0\u00e2\u00e3\u00e9\u00e8\u00ea\u00ed\u00ec\u00ee\u00f3\u00f2\u00f4\u00f5\u00fa\u00f9\u00fb\u00e7]+$/i.test(token);
}

let texto = "";

try {
  texto = await readFile(fonteLocal, "utf8");
} catch {
  throw new Error(
    "Arquivo palavras.txt nao encontrado na raiz do projeto. Coloque a lista em C:/bombquiz/palavras.txt e rode novamente."
  );
}

const palavras = [...new Set(texto.split(/\s+/).filter(ehPalavraJogavel).map(normalizarToken))].sort((a, b) =>
  a.localeCompare(b, "pt-BR")
);

await writeFile(destino, `${JSON.stringify(palavras, null, 2)}\n`, "utf8");
await writeFile(
  destinoInfo,
  `# Fonte das palavras\n\n` +
    `Arquivo gerado por \`npm run importar:palavras\`.\n\n` +
    `Fonte local: \`palavras.txt\`, na raiz do projeto.\n\n` +
    `A lista local foi copiada de https://github.com/pythonprobr/palavras. O projeto original declara licença MPL-2.0 e informa que o arquivo \`palavras.txt\` contém mais de 320.000 palavras do português brasileiro, com fonte principal no dicionário pt-BR do LibreOffice.\n\n` +
    `Filtro aplicado para o jogo:\n\n` +
    `- remove abreviações, nomes próprios com inicial maiúscula e termos compostos com hífen\n` +
    `- mantém apenas palavras com 3 a 24 letras\n` +
    `- mantém acentos, porque o jogo normaliza a entrada antes de validar\n`,
  "utf8"
);

console.log(`Geradas ${palavras.length} palavras a partir de palavras.txt em ${destino.pathname}`);

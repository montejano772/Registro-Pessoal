import palavras from "@/data/palavras.json";
import type { PalavraUsada, RegraSilaba, ResultadoValidacao } from "@/types/jogo";

const palavrasNormalizadas = new Set(palavras.map((palavra) => normalizarPalavra(palavra)));

export function normalizarPalavra(valor: string): string {
  return valor
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function verificarPalavraExiste(palavraNormalizada: string): boolean {
  return palavrasNormalizadas.has(palavraNormalizada);
}

export function verificarPalavraJaUsada(palavraNormalizada: string, usadas: PalavraUsada[]): boolean {
  return usadas.some((palavra) => palavra.palavra_normalizada === palavraNormalizada);
}

export function verificarSilabaNaPalavra(
  palavraNormalizada: string,
  silaba: string,
  regra: RegraSilaba
): boolean {
  const silabaNormalizada = normalizarPalavra(silaba);
  if (regra === "contem") return palavraNormalizada.includes(silabaNormalizada);
  return palavraNormalizada.startsWith(silabaNormalizada);
}

export function validarResposta(params: {
  palavra: string;
  silaba: string;
  regra: RegraSilaba;
  usadas: PalavraUsada[];
}): ResultadoValidacao {
  const palavraNormalizada = normalizarPalavra(params.palavra);

  if (!palavraNormalizada) {
    return { ok: false, mensagem: "Digite uma palavra." };
  }

  if (!verificarPalavraExiste(palavraNormalizada)) {
    return { ok: false, mensagem: "Palavra invalida", palavraNormalizada };
  }

  if (!verificarSilabaNaPalavra(palavraNormalizada, params.silaba, params.regra)) {
    const mensagem =
      params.regra === "contem"
        ? `A palavra precisa conter a silaba ${params.silaba}`
        : `A palavra precisa começar com a silaba ${params.silaba}`;
    return { ok: false, mensagem, palavraNormalizada };
  }

  if (verificarPalavraJaUsada(palavraNormalizada, params.usadas)) {
    return { ok: false, mensagem: "Essa palavra ja foi usada", palavraNormalizada };
  }

  return { ok: true, mensagem: "Resposta correta", palavraNormalizada };
}

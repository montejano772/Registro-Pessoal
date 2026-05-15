"use client";

import type { SessaoLocal } from "@/types/jogo";

const keys = {
  partidaId: "bombquiz_partida_id",
  jogadorId: "bombquiz_jogador_id",
  codigoSala: "bombquiz_codigo_sala"
};

export function salvarSessaoLocal(sessao: SessaoLocal) {
  localStorage.setItem(keys.partidaId, sessao.partidaId);
  localStorage.setItem(keys.jogadorId, sessao.jogadorId);
  localStorage.setItem(keys.codigoSala, sessao.codigoSala);
}

export function recuperarSessaoLocal(): SessaoLocal | null {
  if (typeof window === "undefined") return null;

  const partidaId = localStorage.getItem(keys.partidaId);
  const jogadorId = localStorage.getItem(keys.jogadorId);
  const codigoSala = localStorage.getItem(keys.codigoSala);

  if (!partidaId || !jogadorId || !codigoSala) return null;
  return { partidaId, jogadorId, codigoSala };
}

export function limparSessaoLocal() {
  localStorage.removeItem(keys.partidaId);
  localStorage.removeItem(keys.jogadorId);
  localStorage.removeItem(keys.codigoSala);
}

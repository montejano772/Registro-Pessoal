import { supabase } from "./supabaseClient";
import type { Jogador } from "@/types/jogo";

export async function carregarJogadores(partidaId: string): Promise<Jogador[]> {
  const { data, error } = await supabase
    .from("jogadores")
    .select("*")
    .eq("partida_id", partidaId)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function proximoJogadorAtivo(jogadores: Jogador[], atualId: string): Jogador | null {
  const ativos = jogadores.filter((jogador) => !jogador.eliminado && jogador.tempo_restante > 0);
  if (ativos.length === 0) return null;

  const indiceAtual = ativos.findIndex((jogador) => jogador.id === atualId);
  const proximoIndice = indiceAtual === -1 ? 0 : (indiceAtual + 1) % ativos.length;
  return ativos[proximoIndice] ?? null;
}

export function todosResponderamRodada(jogadores: Jogador[]): boolean {
  const ativos = jogadores.filter((jogador) => !jogador.eliminado && jogador.tempo_restante > 0);
  return ativos.length > 0 && ativos.every((jogador) => jogador.respondeu_rodada_atual);
}

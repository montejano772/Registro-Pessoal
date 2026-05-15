"use client";

import { useCallback, useEffect, useState } from "react";
import { carregarJogadores } from "./jogadorService";
import { carregarPalavrasUsadas } from "./palavrasService";
import { carregarPartidaPorCodigo } from "./partidaService";
import { assinarRealtimeDaPartida } from "./realtimeService";
import type { Jogador, PalavraUsada, Partida } from "@/types/jogo";

export function usePartidaRealtime(codigo: string) {
  const [partida, setPartida] = useState<Partida | null>(null);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [palavrasUsadas, setPalavrasUsadas] = useState<PalavraUsada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const partidaEncontrada = await carregarPartidaPorCodigo(codigo);
      if (!partidaEncontrada) {
        setErro("Sala nao encontrada");
        return;
      }

      const [listaJogadores, listaPalavras] = await Promise.all([
        carregarJogadores(partidaEncontrada.id),
        carregarPalavrasUsadas(partidaEncontrada.id)
      ]);

      setPartida(partidaEncontrada);
      setJogadores(listaJogadores);
      setPalavrasUsadas(listaPalavras);
      setErro("");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar a partida.");
    } finally {
      setCarregando(false);
    }
  }, [codigo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!partida?.id) return;
    return assinarRealtimeDaPartida(partida.id, carregar);
  }, [partida?.id, carregar]);

  return { partida, jogadores, palavrasUsadas, carregando, erro, recarregar: carregar };
}

import { supabase } from "./supabaseClient";

type RealtimeCallback = () => void;

export function assinarRealtimeDaPartida(partidaId: string, callback: RealtimeCallback) {
  const canal = supabase
    .channel(`bombquiz:${partidaId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "partidas", filter: `id=eq.${partidaId}` },
      callback
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "jogadores", filter: `partida_id=eq.${partidaId}` },
      callback
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "palavras_usadas", filter: `partida_id=eq.${partidaId}` },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}

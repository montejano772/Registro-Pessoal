import { supabase } from "./supabaseClient";
import type { PalavraUsada } from "@/types/jogo";

export async function carregarPalavrasUsadas(partidaId: string): Promise<PalavraUsada[]> {
  const { data, error } = await supabase
    .from("palavras_usadas")
    .select("*")
    .eq("partida_id", partidaId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function salvarPalavraUsada(palavra: Omit<PalavraUsada, "id" | "created_at">) {
  const { error } = await supabase.from("palavras_usadas").insert(palavra);
  if (error) throw error;
}

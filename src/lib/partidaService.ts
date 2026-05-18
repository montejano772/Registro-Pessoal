import { carregarJogadores, proximoJogadorAtivo, todosResponderamRodada } from "./jogadorService";
import { carregarPalavrasUsadas, salvarPalavraUsada } from "./palavrasService";
import { sortearSilaba } from "./sortearSilaba";
import { supabase } from "./supabaseClient";
import { calcularTempoGasto, criarInicioOficialDoTurno } from "./tempo";
import { validarResposta } from "./validarPalavra";
import type { Jogador, ModoFimJogo, PalavraUsada, Partida, RegraSilaba, TipoTempo } from "@/types/jogo";

export function gerarCodigoSala(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function carregarPartidaPorCodigo(codigo: string): Promise<Partida | null> {
  const codigoNormalizado = codigo.replace(/\D/g, "").trim();

  const { data, error } = await supabase
    .from("partidas")
    .select("*")
    .eq("codigo_sala", codigoNormalizado)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function carregarPartidaPorId(id: string): Promise<Partida | null> {
  const { data, error } = await supabase.from("partidas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function criarPartida(input: {
  nomePartida: string;
  nomeHost: string;
  tempoInicial: number;
  tipoTempo: TipoTempo;
  quantidadeMaximaJogadores: number;
  regraSilaba: RegraSilaba;
  modoFimJogo: ModoFimJogo;
}): Promise<{ partida: Partida; jogador: Jogador }> {
  let partida: Partida | null = null;
  let tentativas = 0;

  while (!partida && tentativas < 5) {
    tentativas += 1;
    const codigo = gerarCodigoSala();
    const { data, error } = await supabase
      .from("partidas")
      .insert({
        codigo_sala: codigo,
        nome: input.nomePartida,
        status: "aguardando",
        tempo_inicial: input.tempoInicial,
        tipo_tempo: input.tipoTempo,
        tempo_compartilhado_restante: input.tipoTempo === "compartilhado" ? input.tempoInicial : null,
        regra_silaba: input.regraSilaba,
        modo_fim_jogo: input.modoFimJogo,
        rodada_atual: 1,
        silaba_atual: "",
        quantidade_maxima_jogadores: input.quantidadeMaximaJogadores
      })
      .select()
      .single();

    if (error && error.code !== "23505") throw error;
    partida = data ?? null;
  }

  if (!partida) throw new Error("Nao foi possivel gerar um codigo de sala unico.");

  const { data: jogador, error: jogadorError } = await supabase
    .from("jogadores")
    .insert({
      partida_id: partida.id,
      nome: input.nomeHost,
      tempo_restante: input.tempoInicial,
      ordem: 1,
      eliminado: false,
      is_host: true,
      conectado: true,
      respondeu_rodada_atual: false
    })
    .select()
    .single();

  if (jogadorError) throw jogadorError;

  const { data: partidaAtualizada, error: partidaError } = await supabase
    .from("partidas")
    .update({ host_jogador_id: jogador.id })
    .eq("id", partida.id)
    .select()
    .single();

  if (partidaError) throw partidaError;
  return { partida: partidaAtualizada, jogador };
}

export async function entrarNaPartida(codigo: string, nomeJogador: string) {
  const partida = await carregarPartidaPorCodigo(codigo);
  if (!partida) throw new Error("Sala nao encontrada");
  if (partida.status !== "aguardando") throw new Error("Essa partida ja comecou");

  const jogadores = await carregarJogadores(partida.id);
  if (jogadores.length >= partida.quantidade_maxima_jogadores) throw new Error("Sala cheia");

  const { data: jogador, error } = await supabase
    .from("jogadores")
    .insert({
      partida_id: partida.id,
      nome: nomeJogador,
      tempo_restante: partida.tempo_inicial,
      ordem: jogadores.length + 1,
      eliminado: false,
      is_host: false,
      conectado: true,
      respondeu_rodada_atual: false
    })
    .select()
    .single();

  if (error) throw error;
  return { partida, jogador };
}

export async function iniciarPartida(partida: Partida, jogadores: Jogador[]) {
  if (jogadores.length < 2) throw new Error("A partida precisa de pelo menos 2 jogadores.");
  const primeiro = jogadores.find((jogador) => !jogador.eliminado);
  if (!primeiro) throw new Error("Nenhum jogador ativo.");

  const { error } = await supabase
    .from("partidas")
    .update({
      status: "em_andamento",
      rodada_atual: 1,
      silaba_atual: sortearSilaba(),
      tempo_compartilhado_restante:
        partida.tipo_tempo === "compartilhado" ? partida.tempo_compartilhado_restante ?? partida.tempo_inicial : null,
      jogador_atual_id: primeiro.id,
      turno_iniciado_em: criarInicioOficialDoTurno()
    })
    .eq("id", partida.id)
    .eq("status", "aguardando");

  if (error) throw error;
}

export async function encerrarPartida(partidaId: string, vencedorJogadorId?: string | null) {
  const { error } = await supabase
    .from("partidas")
    .update({ status: "finalizada", vencedor_jogador_id: vencedorJogadorId ?? null })
    .eq("id", partidaId);

  if (error) throw error;
}

export async function reiniciarPartida(partida: Partida, jogadores: Jogador[]) {
  const { error: jogadoresError } = await supabase
    .from("jogadores")
    .update({
      tempo_restante: partida.tempo_inicial,
      eliminado: false,
      respondeu_rodada_atual: false
    })
    .eq("partida_id", partida.id);

  if (jogadoresError) throw jogadoresError;

  const primeiro = jogadores.sort((a, b) => a.ordem - b.ordem)[0];
  const { error: palavrasError } = await supabase
    .from("palavras_usadas")
    .delete()
    .eq("partida_id", partida.id);

  if (palavrasError) throw palavrasError;

  const { error } = await supabase
    .from("partidas")
    .update({
      status: "em_andamento",
      rodada_atual: 1,
      silaba_atual: sortearSilaba(partida.silaba_atual),
      tempo_compartilhado_restante: partida.tipo_tempo === "compartilhado" ? partida.tempo_inicial : null,
      jogador_atual_id: primeiro?.id ?? null,
      turno_iniciado_em: criarInicioOficialDoTurno(),
      vencedor_jogador_id: null
    })
    .eq("id", partida.id);

  if (error) throw error;
}

export async function responderTurno(params: {
  partida: Partida;
  jogadorLocalId: string;
  jogadores: Jogador[];
  palavrasUsadas: PalavraUsada[];
  palavra: string;
}) {
  const { partida, jogadorLocalId, jogadores, palavrasUsadas, palavra } = params;
  const partidaAtual = await carregarPartidaPorId(partida.id);

  if (!partidaAtual || partidaAtual.status !== "em_andamento") {
    throw new Error("Essa partida nao esta em andamento.");
  }

  if (partidaAtual.jogador_atual_id !== jogadorLocalId) {
    throw new Error("Apenas o jogador da vez pode responder.");
  }

  const [jogadoresAtuais, palavrasUsadasAtuais] = await Promise.all([
    carregarJogadores(partidaAtual.id),
    carregarPalavrasUsadas(partidaAtual.id)
  ]);
  const jogadorAtual = jogadoresAtuais.find((jogador) => jogador.id === partidaAtual.jogador_atual_id);

  if (!jogadorAtual || jogadorAtual.id !== jogadorLocalId) {
    throw new Error("Apenas o jogador da vez pode responder.");
  }

  const validacao = validarResposta({
    palavra,
    silaba: partidaAtual.silaba_atual,
    regra: partidaAtual.regra_silaba,
    usadas: palavrasUsadasAtuais.length > 0 ? palavrasUsadasAtuais : palavrasUsadas
  });

  if (!validacao.ok || !validacao.palavraNormalizada) {
    return validacao;
  }

  const tempoGasto = Math.max(1, calcularTempoGasto(partidaAtual.turno_iniciado_em));
  const tempoBase =
    partidaAtual.tipo_tempo === "compartilhado"
      ? partidaAtual.tempo_compartilhado_restante ?? partidaAtual.tempo_inicial
      : jogadorAtual.tempo_restante;
  const novoTempo = Math.max(0, tempoBase - tempoGasto);
  const jogadorZerou = novoTempo <= 0;

  try {
    await salvarPalavraUsada({
      partida_id: partidaAtual.id,
      jogador_id: jogadorAtual.id,
      palavra,
      palavra_normalizada: validacao.palavraNormalizada,
      silaba: partidaAtual.silaba_atual,
      rodada: partidaAtual.rodada_atual,
      tempo_gasto: tempoGasto
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return { ok: false, mensagem: "Essa palavra ja foi usada", palavraNormalizada: validacao.palavraNormalizada };
    }

    throw error;
  }

  const jogadoresAposResposta = jogadoresAtuais.map((jogador) =>
    jogador.id === jogadorAtual.id
      ? {
          ...jogador,
          tempo_restante: partidaAtual.tipo_tempo === "compartilhado" ? jogador.tempo_restante : novoTempo,
          eliminado: jogadorZerou || jogador.eliminado,
          respondeu_rodada_atual: true
        }
      : jogador
  );

  const atualizacaoJogador =
    partidaAtual.tipo_tempo === "compartilhado"
      ? {
          eliminado: jogadorZerou || jogadorAtual.eliminado,
          respondeu_rodada_atual: true
        }
      : {
          tempo_restante: novoTempo,
          eliminado: jogadorZerou || jogadorAtual.eliminado,
          respondeu_rodada_atual: true
        };

  const { error: jogadorError } = await supabase.from("jogadores").update(atualizacaoJogador).eq("id", jogadorAtual.id);

  if (jogadorError) throw jogadorError;

  if (partidaAtual.tipo_tempo === "compartilhado" && !jogadorZerou) {
    const { error: partidaError } = await supabase
      .from("partidas")
      .update({ tempo_compartilhado_restante: novoTempo })
      .eq("id", partidaAtual.id);

    if (partidaError) throw partidaError;
  }

  if (jogadorZerou) {
    await tratarTempoEsgotado(partidaAtual, jogadoresAposResposta, jogadorAtual.id);
    return { ok: true, mensagem: "Tempo esgotado", palavraNormalizada: validacao.palavraNormalizada };
  }

  await passarParaProximoJogador(partidaAtual, jogadoresAposResposta, jogadorAtual.id);
  return validacao;
}

export async function registrarTempoEsgotado(partida: Partida, jogadores: Jogador[], jogadorAtualId: string) {
  const partidaAtual = await carregarPartidaPorId(partida.id);

  if (
    !partidaAtual ||
    partidaAtual.status !== "em_andamento" ||
    partidaAtual.jogador_atual_id !== jogadorAtualId
  ) {
    return false;
  }

  const jogadoresAtuais = await carregarJogadores(partidaAtual.id);
  const jogadorAtual = jogadoresAtuais.find((jogador) => jogador.id === jogadorAtualId);

  if (!jogadorAtual || jogadorAtual.eliminado) return false;

  const tempoBase =
    partidaAtual.tipo_tempo === "compartilhado"
      ? partidaAtual.tempo_compartilhado_restante ?? partidaAtual.tempo_inicial
      : jogadorAtual.tempo_restante;

  if (tempoBase <= 0) return false;

  const tempoGasto = calcularTempoGasto(partidaAtual.turno_iniciado_em);

  if (tempoGasto < tempoBase) return false;

  const jogadoresAposTempo = jogadoresAtuais.map((jogador) =>
    jogador.id === jogadorAtualId
      ? { ...jogador, tempo_restante: 0, eliminado: true, respondeu_rodada_atual: true }
      : jogador
  );

  const atualizacaoJogador =
    partidaAtual.tipo_tempo === "compartilhado"
      ? {
          eliminado: true,
          respondeu_rodada_atual: true
        }
      : {
          tempo_restante: 0,
          eliminado: true,
          respondeu_rodada_atual: true
        };

  const { error } = await supabase.from("jogadores").update(atualizacaoJogador).eq("id", jogadorAtualId);

  if (error) throw error;

  if (partidaAtual.tipo_tempo === "compartilhado") {
    const { error: partidaError } = await supabase
      .from("partidas")
      .update({ tempo_compartilhado_restante: 0 })
      .eq("id", partidaAtual.id);

    if (partidaError) throw partidaError;
  }

  await tratarTempoEsgotado(partidaAtual, jogadoresAposTempo, jogadorAtualId);
  return true;
}

async function tratarTempoEsgotado(partida: Partida, jogadores: Jogador[], jogadorEliminadoId: string) {
  if (partida.modo_fim_jogo === "primeiro_eliminado") {
    const vencedor = [...jogadores]
      .filter((jogador) => jogador.id !== jogadorEliminadoId)
      .sort((a, b) => b.tempo_restante - a.tempo_restante)[0];
    await encerrarPartida(partida.id, vencedor?.id ?? null);
    return;
  }

  const ativos = jogadores.filter((jogador) => !jogador.eliminado && jogador.tempo_restante > 0);
  if (ativos.length <= 1) {
    await encerrarPartida(partida.id, ativos[0]?.id ?? null);
    return;
  }

  if (partida.tipo_tempo === "compartilhado") {
    const { error } = await supabase
      .from("partidas")
      .update({ tempo_compartilhado_restante: partida.tempo_inicial })
      .eq("id", partida.id);

    if (error) throw error;
  }

  await passarParaProximoJogador(partida, jogadores, jogadorEliminadoId);
}

export async function passarParaProximoJogador(partida: Partida, jogadores: Jogador[], jogadorAtualId: string) {
  if (todosResponderamRodada(jogadores)) {
    await iniciarNovaRodada(partida, jogadores);
    return;
  }

  const proximo = proximoJogadorAtivo(jogadores, jogadorAtualId);
  const { error } = await supabase
    .from("partidas")
    .update({
      jogador_atual_id: proximo?.id ?? null,
      turno_iniciado_em: criarInicioOficialDoTurno()
    })
    .eq("id", partida.id)
    .eq("jogador_atual_id", jogadorAtualId);

  if (error) throw error;
}

export async function iniciarNovaRodada(partida: Partida, jogadores: Jogador[]) {
  const ativos = jogadores
    .filter((jogador) => !jogador.eliminado && jogador.tempo_restante > 0)
    .sort((a, b) => a.ordem - b.ordem);

  const primeiro = ativos[0] ?? null;

  const { error: jogadoresError } = await supabase
    .from("jogadores")
    .update({ respondeu_rodada_atual: false })
    .eq("partida_id", partida.id);

  if (jogadoresError) throw jogadoresError;

  const { error } = await supabase
    .from("partidas")
    .update({
      rodada_atual: partida.rodada_atual + 1,
      silaba_atual: sortearSilaba(partida.silaba_atual),
      jogador_atual_id: primeiro?.id ?? null,
      turno_iniciado_em: criarInicioOficialDoTurno()
    })
    .eq("id", partida.id);

  if (error) throw error;
}

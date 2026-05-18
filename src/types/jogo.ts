export type StatusPartida = "aguardando" | "em_andamento" | "finalizada";
export type RegraSilaba = "comeca_com" | "contem";
export type ModoFimJogo = "primeiro_eliminado" | "eliminacao";
export type TipoTempo = "individual" | "compartilhado";

export type Partida = {
  id: string;
  codigo_sala: string;
  nome: string | null;
  host_jogador_id: string | null;
  status: StatusPartida;
  tempo_inicial: number;
  tipo_tempo: TipoTempo;
  tempo_compartilhado_restante: number | null;
  regra_silaba: RegraSilaba;
  modo_fim_jogo: ModoFimJogo;
  rodada_atual: number;
  silaba_atual: string;
  jogador_atual_id: string | null;
  turno_iniciado_em: string | null;
  quantidade_maxima_jogadores: number;
  vencedor_jogador_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Jogador = {
  id: string;
  partida_id: string;
  nome: string;
  tempo_restante: number;
  ordem: number;
  eliminado: boolean;
  is_host: boolean;
  conectado: boolean;
  respondeu_rodada_atual: boolean;
  created_at: string;
  updated_at: string;
};

export type PalavraUsada = {
  id: string;
  partida_id: string;
  jogador_id: string;
  palavra: string;
  palavra_normalizada: string;
  silaba: string;
  rodada: number;
  tempo_gasto: number;
  created_at: string;
};

export type SessaoLocal = {
  partidaId: string;
  jogadorId: string;
  codigoSala: string;
};

export type ResultadoValidacao = {
  ok: boolean;
  mensagem: string;
  palavraNormalizada?: string;
};

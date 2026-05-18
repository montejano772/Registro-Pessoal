"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Square } from "lucide-react";
import { Botao } from "@/components/Botao";
import { CampoResposta } from "@/components/CampoResposta";
import { ContagemRegressiva } from "@/components/ContagemRegressiva";
import { Cronometro } from "@/components/Cronometro";
import { ListaJogadores } from "@/components/ListaJogadores";
import { MensagemJogo } from "@/components/MensagemJogo";
import { encerrarPartida, registrarTempoEsgotado, responderTurno } from "@/lib/partidaService";
import { recuperarSessaoLocal } from "@/lib/storage";
import { usePartidaRealtime } from "@/lib/usePartidaRealtime";

export default function JogoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const router = useRouter();
  const { partida, jogadores, palavrasUsadas, carregando, erro } = usePartidaRealtime(codigo);
  const [jogadorLocalId, setJogadorLocalId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"ok" | "erro" | "info">("info");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setJogadorLocalId(recuperarSessaoLocal()?.jogadorId ?? null);
  }, []);

  useEffect(() => {
    if (partida?.status === "aguardando") router.replace(`/lobby/${partida.codigo_sala}`);
    if (partida?.status === "finalizada") router.replace(`/resultado/${partida.codigo_sala}`);
  }, [partida, router]);

  const jogadorAtual = useMemo(
    () => jogadores.find((jogador) => jogador.id === partida?.jogador_atual_id) ?? null,
    [jogadores, partida?.jogador_atual_id]
  );
  const souJogadorAtual = !!jogadorLocalId && jogadorLocalId === partida?.jogador_atual_id;
  const souHost = !!jogadorLocalId && jogadorLocalId === partida?.host_jogador_id;

  async function responder(palavra: string) {
    if (!partida || !jogadorLocalId) return;
    setEnviando(true);
    try {
      const resultado = await responderTurno({ partida, jogadorLocalId, jogadores, palavrasUsadas, palavra });
      setMensagem(resultado.mensagem);
      setTipoMensagem(resultado.ok ? "ok" : "erro");
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Erro ao responder.");
      setTipoMensagem("erro");
    } finally {
      setEnviando(false);
    }
  }

  async function finalizar() {
    if (!partida) return;
    await encerrarPartida(partida.id, null);
  }

  const tempoEsgotado = useCallback(async () => {
    if (!partida?.jogador_atual_id) return;

    try {
      const registrou = await registrarTempoEsgotado(partida, jogadores, partida.jogador_atual_id);

      if (registrou) {
        setMensagem(`Tempo esgotado para ${jogadorAtual?.nome ?? "o jogador"}`);
        setTipoMensagem("erro");
      }
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Erro ao registrar tempo esgotado.");
      setTipoMensagem("erro");
    }
  }, [jogadorAtual, jogadores, partida]);

  if (carregando) return <main className="pagina estado">Carregando jogo...</main>;
  if (!partida) return <main className="pagina estado">{erro || "Partida nao encontrada."}</main>;

  return (
    <main className="pagina jogo">
      <ContagemRegressiva
        chaveTurno={`${partida.rodada_atual}-${partida.jogador_atual_id}`}
        turnoIniciadoEm={partida.turno_iniciado_em}
      />

      <section className="placar-topo">
        <span>Rodada {partida.rodada_atual}</span>
        <strong>{souJogadorAtual ? "Sua vez" : `Aguardando ${jogadorAtual?.nome ?? "jogador"}`}</strong>
      </section>

      <section className="arena">
        <p>Silaba atual</p>
        <h1>{partida.silaba_atual}</h1>
        {jogadorAtual && (
          <Cronometro
            tempoRestante={jogadorAtual.tempo_restante}
            turnoIniciadoEm={partida.turno_iniciado_em}
            ativo={!!partida.turno_iniciado_em}
            onTempoEsgotado={souJogadorAtual ? tempoEsgotado : undefined}
          />
        )}
      </section>

      <CampoResposta bloqueado={!souJogadorAtual} enviando={enviando} onResponder={responder} />
      {!souJogadorAtual && <p className="aviso">Aguardando resposta de {jogadorAtual?.nome ?? "outro jogador"}</p>}
      <MensagemJogo mensagem={mensagem || erro} tipo={erro ? "erro" : tipoMensagem} />

      <ListaJogadores jogadores={jogadores} jogadorAtualId={partida.jogador_atual_id} />

      {souHost && (
        <Botao variante="perigo" onClick={finalizar}>
          <Square size={18} /> Encerrar partida
        </Botao>
      )}
    </main>
  );
}

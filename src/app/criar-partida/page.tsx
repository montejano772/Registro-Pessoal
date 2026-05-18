"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Botao } from "@/components/Botao";
import { MensagemJogo } from "@/components/MensagemJogo";
import { criarPartida } from "@/lib/partidaService";
import { salvarSessaoLocal } from "@/lib/storage";
import type { ModoFimJogo, RegraSilaba, TipoTempo } from "@/types/jogo";

export default function CriarPartidaPage() {
  const router = useRouter();
  const [nomeHost, setNomeHost] = useState("");
  const [nomePartida, setNomePartida] = useState("Partida BombQuiz");
  const [tempoInicial, setTempoInicial] = useState(60);
  const [tipoTempo, setTipoTempo] = useState<TipoTempo>("individual");
  const [maxJogadores, setMaxJogadores] = useState(6);
  const [regraSilaba, setRegraSilaba] = useState<RegraSilaba>("comeca_com");
  const [modoFimJogo, setModoFimJogo] = useState<ModoFimJogo>("eliminacao");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    try {
      const { partida, jogador } = await criarPartida({
        nomeHost,
        nomePartida,
        tempoInicial,
        tipoTempo,
        quantidadeMaximaJogadores: maxJogadores,
        regraSilaba,
        modoFimJogo
      });

      salvarSessaoLocal({ partidaId: partida.id, jogadorId: jogador.id, codigoSala: partida.codigo_sala });
      router.push(`/lobby/${partida.codigo_sala}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar sala.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="pagina">
      <Link className="voltar" href="/">
        <ArrowLeft size={18} /> Inicio
      </Link>
      <section className="formulario">
        <h1>Criar partida</h1>
        <form onSubmit={enviar}>
          <label>
            Nome do jogador host
            <input required value={nomeHost} onChange={(event) => setNomeHost(event.target.value)} />
          </label>
          <label>
            Nome da partida
            <input required value={nomePartida} onChange={(event) => setNomePartida(event.target.value)} />
          </label>
          <label>
            Tempo inicial
            <select value={tempoInicial} onChange={(event) => setTempoInicial(Number(event.target.value))}>
              {[30, 60, 90, 120].map((tempo) => (
                <option key={tempo} value={tempo}>
                  {tempo} segundos
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de tempo
            <select value={tipoTempo} onChange={(event) => setTipoTempo(event.target.value as TipoTempo)}>
              <option value="individual">Individual por jogador</option>
              <option value="compartilhado">Compartilhado da partida</option>
            </select>
          </label>
          <label>
            Maximo de jogadores
            <input
              type="number"
              min={2}
              max={12}
              value={maxJogadores}
              onChange={(event) => setMaxJogadores(Number(event.target.value))}
            />
          </label>
          <label>
            Regra da silaba
            <select value={regraSilaba} onChange={(event) => setRegraSilaba(event.target.value as RegraSilaba)}>
              <option value="comeca_com">Comeca com a silaba</option>
              <option value="contem">Contem a silaba</option>
            </select>
          </label>
          <label>
            Modo de fim de jogo
            <select value={modoFimJogo} onChange={(event) => setModoFimJogo(event.target.value as ModoFimJogo)}>
              <option value="primeiro_eliminado">Fim ao primeiro eliminado</option>
              <option value="eliminacao">Eliminacao ate sobrar um</option>
            </select>
          </label>
          <MensagemJogo mensagem={erro} tipo="erro" />
          <Botao disabled={salvando}>{salvando ? "Criando..." : "Criar sala"}</Botao>
        </form>
      </section>
    </main>
  );
}

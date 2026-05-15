"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { Botao } from "@/components/Botao";
import { CodigoSala } from "@/components/CodigoSala";
import { ListaJogadores } from "@/components/ListaJogadores";
import { MensagemJogo } from "@/components/MensagemJogo";
import { iniciarPartida } from "@/lib/partidaService";
import { recuperarSessaoLocal } from "@/lib/storage";
import { usePartidaRealtime } from "@/lib/usePartidaRealtime";

export default function LobbyPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const router = useRouter();
  const { partida, jogadores, carregando, erro } = usePartidaRealtime(codigo);
  const [jogadorLocalId, setJogadorLocalId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    setJogadorLocalId(recuperarSessaoLocal()?.jogadorId ?? null);
  }, []);

  useEffect(() => {
    if (partida?.status === "em_andamento") router.replace(`/jogo/${partida.codigo_sala}`);
    if (partida?.status === "finalizada") router.replace(`/resultado/${partida.codigo_sala}`);
  }, [partida, router]);

  const souHost = jogadorLocalId === partida?.host_jogador_id;

  async function iniciar() {
    if (!partida) return;
    setMensagem("");
    setIniciando(true);
    try {
      await iniciarPartida(partida, jogadores);
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Erro ao iniciar partida.");
    } finally {
      setIniciando(false);
    }
  }

  if (carregando) return <main className="pagina estado">Carregando lobby...</main>;

  return (
    <main className="pagina">
      <Link className="voltar" href="/">
        <ArrowLeft size={18} /> Inicio
      </Link>
      <section className="cabecalho-sala">
        <div>
          <span>Aguardando jogadores</span>
          <h1>{partida?.nome ?? "BombQuiz"}</h1>
        </div>
        {partida && <CodigoSala codigo={partida.codigo_sala} />}
      </section>

      <ListaJogadores jogadores={jogadores} />
      <MensagemJogo mensagem={erro || mensagem} tipo="erro" />

      {souHost ? (
        <Botao disabled={jogadores.length < 2 || iniciando} onClick={iniciar}>
          <Play size={20} /> {iniciando ? "Iniciando..." : "Iniciar partida"}
        </Botao>
      ) : (
        <p className="aviso">Aguardando o host iniciar a partida</p>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { Botao } from "@/components/Botao";
import { ListaJogadores } from "@/components/ListaJogadores";
import { limparSessaoLocal, recuperarSessaoLocal } from "@/lib/storage";
import { reiniciarPartida } from "@/lib/partidaService";
import { usePartidaRealtime } from "@/lib/usePartidaRealtime";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const router = useRouter();
  const { partida, jogadores, palavrasUsadas, carregando } = usePartidaRealtime(codigo);
  const [jogadorLocalId, setJogadorLocalId] = useState<string | null>(null);

  useEffect(() => {
    setJogadorLocalId(recuperarSessaoLocal()?.jogadorId ?? null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const vencedor = useMemo(
    () =>
      jogadores.find((jogador) => jogador.id === partida?.vencedor_jogador_id) ??
      [...jogadores].sort((a, b) => b.tempo_restante - a.tempo_restante)[0],
    [jogadores, partida?.vencedor_jogador_id]
  );
  const eliminados = jogadores.filter((jogador) => jogador.eliminado || jogador.tempo_restante <= 0);
  const souHost = jogadorLocalId === partida?.host_jogador_id;
  const tempoCompartilhado = partida?.tipo_tempo === "compartilhado";

  async function jogarNovamente() {
    if (!partida) return;
    await reiniciarPartida(partida, jogadores);
    router.push(`/lobby/${partida.codigo_sala}`);
  }

  function voltarInicio() {
    limparSessaoLocal();
  }

  if (carregando) return <main className="pagina estado">Carregando resultado...</main>;

  return (
    <main className="pagina">
      <section className="resultado-hero">
        <span>Fim de jogo</span>
        <h1>{vencedor ? `${vencedor.nome} venceu` : "Partida encerrada"}</h1>
        {eliminados.length > 0 && (
          <p>{eliminados.map((jogador) => jogador.nome).join(", ")} perdeu por tempo esgotado.</p>
        )}
        {tempoCompartilhado && <p>Modo tempo compartilhado: a bomba era unica para todos os jogadores.</p>}
      </section>

      <h2>Ranking</h2>
      <ListaJogadores
        jogadores={[...jogadores].sort((a, b) => Number(a.eliminado) - Number(b.eliminado))}
        mostrarTempo={!tempoCompartilhado}
      />

      <section className="palavras-usadas">
        <h2>Palavras usadas</h2>
        {jogadores.map((jogador) => {
          const palavras = palavrasUsadas.filter((palavra) => palavra.jogador_id === jogador.id);
          return (
            <article key={jogador.id}>
              <strong>{jogador.nome}</strong>
              <p>{palavras.map((palavra) => palavra.palavra).join(", ") || "Nenhuma palavra"}</p>
            </article>
          );
        })}
      </section>

      <div className="acoes-linha">
        {souHost && (
          <Botao onClick={jogarNovamente}>
            <RotateCcw size={18} /> Jogar novamente
          </Botao>
        )}
        <Link href="/" onClick={voltarInicio}>
          <Botao variante="secundario">
            <Home size={18} /> Voltar ao inicio
          </Botao>
        </Link>
      </div>
    </main>
  );
}

import type { Jogador } from "@/types/jogo";
import { formatarTempo } from "@/lib/tempo";

type CardJogadorProps = {
  jogador: Jogador;
  destaque?: boolean;
};

export function CardJogador({ jogador, destaque }: CardJogadorProps) {
  return (
    <article className={`card-jogador ${destaque ? "card-jogador-atual" : ""}`}>
      <div>
        <strong>{jogador.nome}</strong>
        <span>{jogador.is_host ? "Host" : `Ordem ${jogador.ordem}`}</span>
      </div>
      <div className={jogador.eliminado ? "tempo eliminado" : "tempo"}>
        {jogador.eliminado ? "Eliminado" : formatarTempo(jogador.tempo_restante)}
      </div>
    </article>
  );
}

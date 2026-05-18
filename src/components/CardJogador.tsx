import type { Jogador } from "@/types/jogo";
import { formatarTempo } from "@/lib/tempo";

type CardJogadorProps = {
  jogador: Jogador;
  destaque?: boolean;
  mostrarTempo?: boolean;
};

export function CardJogador({ jogador, destaque, mostrarTempo = true }: CardJogadorProps) {
  return (
    <article className={`card-jogador ${destaque ? "card-jogador-atual" : ""}`}>
      <div>
        <strong>{jogador.nome}</strong>
        <span>{jogador.is_host ? "Host" : `Ordem ${jogador.ordem}`}</span>
      </div>
      {mostrarTempo && (
        <div className={jogador.eliminado ? "tempo eliminado" : "tempo"}>
          {jogador.eliminado ? "Eliminado" : formatarTempo(jogador.tempo_restante)}
        </div>
      )}
      {!mostrarTempo && jogador.eliminado && <div className="tempo eliminado">Eliminado</div>}
    </article>
  );
}

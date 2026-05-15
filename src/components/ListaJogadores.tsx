import type { Jogador } from "@/types/jogo";
import { CardJogador } from "./CardJogador";

type ListaJogadoresProps = {
  jogadores: Jogador[];
  jogadorAtualId?: string | null;
};

export function ListaJogadores({ jogadores, jogadorAtualId }: ListaJogadoresProps) {
  return (
    <div className="lista-jogadores">
      {jogadores.map((jogador) => (
        <CardJogador key={jogador.id} jogador={jogador} destaque={jogador.id === jogadorAtualId} />
      ))}
    </div>
  );
}

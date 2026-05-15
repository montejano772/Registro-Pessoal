"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bomb, LogIn, Plus, RotateCcw } from "lucide-react";
import { Botao } from "@/components/Botao";
import { recuperarSessaoLocal } from "@/lib/storage";
import type { SessaoLocal } from "@/types/jogo";

export default function HomePage() {
  const [sessao, setSessao] = useState<SessaoLocal | null>(null);

  useEffect(() => {
    setSessao(recuperarSessaoLocal());
  }, []);

  return (
    <main className="pagina inicial">
      <section className="hero">
        <div className="marca">
          <Bomb size={42} />
          <h1>BombQuiz</h1>
        </div>
        <p>Palavras em portugues, sala por codigo e um cronometro individual para cada jogador.</p>
      </section>

      <nav className="painel-acoes">
        <Link href="/criar-partida">
          <Botao>
            <Plus size={20} /> Criar partida
          </Botao>
        </Link>
        <Link href="/entrar">
          <Botao variante="secundario">
            <LogIn size={20} /> Entrar em partida
          </Botao>
        </Link>
        {sessao && (
          <Link href={`/lobby/${sessao.codigoSala}`}>
            <Botao variante="secundario">
              <RotateCcw size={20} /> Continuar partida
            </Botao>
          </Link>
        )}
      </nav>
    </main>
  );
}

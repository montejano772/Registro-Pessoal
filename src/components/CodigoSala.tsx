"use client";

import { Copy, Share2 } from "lucide-react";
import { Botao } from "./Botao";

type CodigoSalaProps = {
  codigo: string;
};

export function CodigoSala({ codigo }: CodigoSalaProps) {
  async function copiar() {
    await navigator.clipboard.writeText(codigo);
  }

  async function compartilhar() {
    if (navigator.share) {
      await navigator.share({ title: "BombQuiz", text: `Entre na minha sala BombQuiz: ${codigo}` });
      return;
    }
    await copiar();
  }

  return (
    <section className="codigo-sala">
      <span>Codigo da sala</span>
      <strong>{codigo}</strong>
      <div className="acoes-linha">
        <Botao type="button" variante="secundario" onClick={copiar} title="Copiar codigo">
          <Copy size={18} /> Copiar
        </Botao>
        <Botao type="button" variante="secundario" onClick={compartilhar} title="Compartilhar codigo">
          <Share2 size={18} /> Compartilhar
        </Botao>
      </div>
    </section>
  );
}

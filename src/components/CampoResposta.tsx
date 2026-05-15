"use client";

import { FormEvent, useState } from "react";
import { Botao } from "./Botao";

type CampoRespostaProps = {
  bloqueado: boolean;
  enviando: boolean;
  onResponder: (palavra: string) => Promise<void> | void;
};

export function CampoResposta({ bloqueado, enviando, onResponder }: CampoRespostaProps) {
  const [palavra, setPalavra] = useState("");

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (bloqueado || enviando) return;
    await onResponder(palavra);
    setPalavra("");
  }

  return (
    <form className="campo-resposta" onSubmit={enviar}>
      <input
        value={palavra}
        onChange={(event) => setPalavra(event.target.value)}
        disabled={bloqueado || enviando}
        placeholder="Digite uma palavra"
        autoComplete="off"
      />
      <Botao disabled={bloqueado || enviando}>{enviando ? "Enviando..." : "Responder"}</Botao>
    </form>
  );
}

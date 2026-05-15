"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Botao } from "@/components/Botao";
import { MensagemJogo } from "@/components/MensagemJogo";
import { entrarNaPartida } from "@/lib/partidaService";
import { salvarSessaoLocal } from "@/lib/storage";

export default function EntrarPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setErro("");
    setEntrando(true);

    try {
      const { partida, jogador } = await entrarNaPartida(codigo, nome);
      salvarSessaoLocal({ partidaId: partida.id, jogadorId: jogador.id, codigoSala: partida.codigo_sala });
      router.push(`/lobby/${partida.codigo_sala}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao entrar na sala.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <main className="pagina">
      <Link className="voltar" href="/">
        <ArrowLeft size={18} /> Inicio
      </Link>
      <section className="formulario">
        <h1>Entrar em partida</h1>
        <form onSubmit={enviar}>
          <label>
            Codigo da sala
            <input
              required
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="482135"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </label>
          <label>
            Seu nome
            <input required value={nome} onChange={(event) => setNome(event.target.value)} />
          </label>
          <MensagemJogo mensagem={erro} tipo="erro" />
          <Botao disabled={entrando}>{entrando ? "Entrando..." : "Entrar"}</Botao>
        </form>
      </section>
    </main>
  );
}

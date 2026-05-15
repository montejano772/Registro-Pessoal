type MensagemJogoProps = {
  mensagem?: string;
  tipo?: "ok" | "erro" | "info";
};

export function MensagemJogo({ mensagem, tipo = "info" }: MensagemJogoProps) {
  if (!mensagem) return null;
  return <p className={`mensagem mensagem-${tipo}`}>{mensagem}</p>;
}

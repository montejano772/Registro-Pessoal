"use client";

import { useEffect, useRef, useState } from "react";
import { formatarTempo, SEGUNDOS_CONTAGEM_REGRESSIVA, tempoVisualRestante } from "@/lib/tempo";

type CronometroProps = {
  tempoRestante: number;
  turnoIniciadoEm: string | null;
  ativo: boolean;
  segundosDeEspera?: number;
  onTempoEsgotado?: () => void;
};

export function Cronometro({
  tempoRestante,
  turnoIniciadoEm,
  ativo,
  segundosDeEspera = SEGUNDOS_CONTAGEM_REGRESSIVA,
  onTempoEsgotado
}: CronometroProps) {
  const [valor, setValor] = useState(tempoRestante);
  const esgotadoAvisado = useRef(false);

  useEffect(() => {
    esgotadoAvisado.current = false;
  }, [turnoIniciadoEm]);

  useEffect(() => {
    if (!ativo) {
      setValor(tempoRestante);
      return;
    }

    const atualizar = () => {
      const restante = tempoVisualRestante(tempoRestante, turnoIniciadoEm, segundosDeEspera);
      setValor(restante);

      if (restante <= 0 && !esgotadoAvisado.current) {
        esgotadoAvisado.current = true;
        onTempoEsgotado?.();
      }
    };

    atualizar();
    const id = window.setInterval(atualizar, 250);
    return () => window.clearInterval(id);
  }, [ativo, onTempoEsgotado, segundosDeEspera, tempoRestante, turnoIniciadoEm]);

  return <div className={`cronometro ${valor <= 10 ? "cronometro-alerta" : ""}`}>{formatarTempo(valor)}</div>;
}

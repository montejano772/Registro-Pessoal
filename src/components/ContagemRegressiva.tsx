"use client";

import { useEffect, useState } from "react";

type ContagemRegressivaProps = {
  chaveTurno: string;
  turnoIniciadoEm: string | null;
};

export function ContagemRegressiva({ chaveTurno, turnoIniciadoEm }: ContagemRegressivaProps) {
  const [numero, setNumero] = useState<number | null>(3);

  useEffect(() => {
    if (!turnoIniciadoEm) {
      setNumero(null);
      return;
    }

    const atualizar = () => {
      const restanteMs = new Date(turnoIniciadoEm).getTime() - Date.now();

      if (restanteMs <= 0) {
        setNumero(null);
        return;
      }

      setNumero(Math.ceil(restanteMs / 1000));
    };

    atualizar();
    const id = window.setInterval(atualizar, 150);
    return () => window.clearInterval(id);
  }, [chaveTurno, turnoIniciadoEm]);

  if (!numero) return null;
  return <div className="contagem">{numero}</div>;
}

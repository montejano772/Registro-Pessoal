"use client";

import { useEffect, useState } from "react";

type ContagemRegressivaProps = {
  chaveTurno: string;
};

export function ContagemRegressiva({ chaveTurno }: ContagemRegressivaProps) {
  const [numero, setNumero] = useState<number | null>(3);

  useEffect(() => {
    setNumero(3);
    const tempos = [
      window.setTimeout(() => setNumero(2), 700),
      window.setTimeout(() => setNumero(1), 1400),
      window.setTimeout(() => setNumero(null), 2100)
    ];
    return () => tempos.forEach(window.clearTimeout);
  }, [chaveTurno]);

  if (!numero) return null;
  return <div className="contagem">{numero}</div>;
}

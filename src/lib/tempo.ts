export const SEGUNDOS_CONTAGEM_REGRESSIVA = 3;

export function calcularTempoGasto(
  turnoIniciadoEm: string | null,
  agora = new Date(),
  segundosDeEspera = 0
): number {
  if (!turnoIniciadoEm) return 0;
  const inicio = new Date(turnoIniciadoEm).getTime();
  return Math.max(0, Math.ceil((agora.getTime() - inicio) / 1000) - segundosDeEspera);
}

export function formatarTempo(segundos: number): string {
  const seguro = Math.max(0, Math.ceil(segundos));
  const minutos = Math.floor(seguro / 60).toString().padStart(2, "0");
  const resto = (seguro % 60).toString().padStart(2, "0");
  return `${minutos}:${resto}`;
}

export function tempoVisualRestante(
  tempoRestante: number,
  turnoIniciadoEm: string | null,
  segundosDeEspera = 0
): number {
  return Math.max(0, tempoRestante - calcularTempoGasto(turnoIniciadoEm, new Date(), segundosDeEspera));
}

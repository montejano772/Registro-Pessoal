export function calcularTempoGasto(turnoIniciadoEm: string | null, agora = new Date()): number {
  if (!turnoIniciadoEm) return 0;
  const inicio = new Date(turnoIniciadoEm).getTime();
  return Math.max(0, Math.ceil((agora.getTime() - inicio) / 1000));
}

export function formatarTempo(segundos: number): string {
  const seguro = Math.max(0, Math.ceil(segundos));
  const minutos = Math.floor(seguro / 60).toString().padStart(2, "0");
  const resto = (seguro % 60).toString().padStart(2, "0");
  return `${minutos}:${resto}`;
}

export function tempoVisualRestante(tempoRestante: number, turnoIniciadoEm: string | null): number {
  return Math.max(0, tempoRestante - calcularTempoGasto(turnoIniciadoEm));
}

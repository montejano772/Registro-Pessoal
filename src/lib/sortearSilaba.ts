import silabas from "@/data/silabas.json";

export function sortearSilaba(ultima?: string): string {
  const candidatas = silabas.filter((silaba) => silaba !== ultima);
  const lista = candidatas.length > 0 ? candidatas : silabas;
  return lista[Math.floor(Math.random() * lista.length)];
}

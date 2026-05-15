import type { Jogador, PalavraUsada, Partida } from "./jogo";

export type Database = {
  public: {
    Tables: {
      partidas: {
        Row: Partida;
        Insert: Partial<Partida> & {
          codigo_sala: string;
          tempo_inicial: number;
          quantidade_maxima_jogadores: number;
        };
        Update: Partial<Partida>;
        Relationships: [];
      };
      jogadores: {
        Row: Jogador;
        Insert: Partial<Jogador> & {
          partida_id: string;
          nome: string;
          tempo_restante: number;
          ordem: number;
        };
        Update: Partial<Jogador>;
        Relationships: [];
      };
      palavras_usadas: {
        Row: PalavraUsada;
        Insert: Omit<PalavraUsada, "id" | "created_at">;
        Update: Partial<PalavraUsada>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

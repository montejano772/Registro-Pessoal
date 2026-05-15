import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { PwaRegistrar } from "./pwa-registrar";

export const metadata: Metadata = {
  title: "BombQuiz",
  description: "Jogo multiplayer de palavras em portugues com tempo individual.",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#161616"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}

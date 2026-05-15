import type { ButtonHTMLAttributes, ReactNode } from "react";

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variante?: "primario" | "secundario" | "perigo";
};

export function Botao({ children, variante = "primario", className = "", ...props }: BotaoProps) {
  return (
    <button className={`botao botao-${variante} ${className}`} {...props}>
      {children}
    </button>
  );
}

"use client";

import { ThemeProvider } from "@mui/material/styles";

import { theme } from "./index";

/**
 * Aplica o tema MUI do projeto (cores da marca) em todo o app. Fica num componente cliente
 * porque o tema tem funções e não pode ser passado de um componente de servidor.
 * Sem CssBaseline de propósito: o reset de estilos fica com o Tailwind (globals.css).
 */
export default function TemaProvider({ children }: { children: React.ReactNode }) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

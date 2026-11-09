import type { MenuProps, SxProps, Theme } from "@mui/material";

/**
 * Estilos MUI do painel de pedidos. O tema do projeto (src/theme) ainda não é aplicado com
 * ThemeProvider, então a cor da marca vai direto aqui para o foco não ficar azul.
 */

export const VERMELHO = "#EE2C2E";

/** Campo arredondado (busca, select) com foco na cor da marca. */
export const campoArredondado: SxProps<Theme> = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "999px",
        backgroundColor: "#fff",
        fontSize: 14,
        "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
        "&:hover fieldset": { borderColor: "rgba(0,0,0,0.3)" },
        "&.Mui-focused fieldset": { borderColor: VERMELHO, borderWidth: 2 },
    },
};

/** Campo de texto comum (cantos de 12px) com foco na cor da marca. */
export const campoTexto: SxProps<Theme> = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        "&.Mui-focused fieldset": { borderColor: VERMELHO },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: VERMELHO },
};

/** Menu que abre do select: cartão com sombra, item marcado em vermelho claro. */
export const menuSuspenso: Partial<MenuProps> = {
    slotProps: {
        paper: {
            sx: {
                mt: 1,
                borderRadius: "14px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                border: "1px solid rgba(0,0,0,0.06)",
                "& .MuiMenuItem-root": {
                    fontSize: 14,
                    mx: 0.75,
                    my: 0.25,
                    borderRadius: "10px",
                    minHeight: 40,
                },
                "& .MuiMenuItem-root.Mui-selected": {
                    backgroundColor: "rgba(238,44,46,0.08)",
                    color: VERMELHO,
                    fontWeight: 600,
                },
                "& .MuiMenuItem-root.Mui-selected:hover": {
                    backgroundColor: "rgba(238,44,46,0.12)",
                },
            },
        },
    },
};

import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

// As fontes vêm do next/font (layout raiz) como variáveis CSS.
const FONTE_CORPO = "var(--fonte-corpo), system-ui, sans-serif";
const FONTE_DISPLAY = "var(--fonte-display), var(--fonte-corpo), system-ui, sans-serif";

export const theme = createTheme({
  cssVariables: true,

  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },

    secondary: {
      main: colors.text.primary,
      contrastText: "#FFFFFF",
    },

    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },

    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },

    success: {
      main: colors.success,
    },

    warning: {
      main: colors.warning,
    },

    error: {
      main: colors.error,
    },

    info: {
      main: colors.info,
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: FONTE_CORPO,
    h1: { fontFamily: FONTE_DISPLAY, fontWeight: 800 },
    h2: { fontFamily: FONTE_DISPLAY, fontWeight: 800 },
    h3: { fontFamily: FONTE_DISPLAY, fontWeight: 800 },
    h4: { fontFamily: FONTE_DISPLAY, fontWeight: 800 },
    h5: { fontFamily: FONTE_DISPLAY, fontWeight: 700 },
    h6: { fontFamily: FONTE_DISPLAY, fontWeight: 700 },
    // Botões em caixa normal: "Salvar produto", não "SALVAR PRODUTO".
    button: { fontFamily: FONTE_DISPLAY, fontWeight: 700, textTransform: "none" },
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        // O subtítulo (p) dentro do título não herda o peso da variante h6.
        root: { "& p": { fontFamily: FONTE_CORPO, fontWeight: 400 } },
      },
    },
  },
});

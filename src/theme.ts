import { createTheme } from "@mui/material/styles";

// Material-3 inspired tokens with modern neutral palette and gentle accents.
// Export a function to get theme by mode to make switching explicit.
export const getTheme = (mode: "light" | "dark" = "dark") =>
  createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            primary: { main: "#7b61ff" },
            secondary: { main: "#00d4ff" },
            background: { default: "#f6f7fb", paper: "rgba(255,255,255,0.8)" },
            surface: { main: "rgba(255,255,255,0.8)" },
          }
        : {
            primary: { main: "#7b61ff" },
            secondary: { main: "#00d4ff" },
            background: { default: "#071033", paper: "rgba(255,255,255,0.04)" },
            surface: { main: "rgba(255,255,255,0.04)" },
          }),
    },
    typography: {
      fontFamily: [
        "Inter",
        "Segoe UI",
        "Roboto",
        "system-ui",
        "sans-serif",
      ].join(","),
      h6: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      body1: { fontSize: "1rem" },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundClip: "border-box",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              "linear-gradient(90deg, rgba(123,97,255,0.12), rgba(0,212,255,0.06))",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            boxShadow: "0 10px 30px rgba(2,6,23,0.5)",
          },
        },
      },
    },
  });

export type AppTheme = ReturnType<typeof getTheme>;

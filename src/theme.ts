import { createTheme } from '@mui/material/styles'

// Material-3 inspired tokens with modern neutral palette and gentle accents.
// Export a function to get theme by mode to make switching explicit.
export const getTheme = (mode: 'light' | 'dark' = 'light') =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#6C4CF0' },
            secondary: { main: '#00C2A8' },
            background: { default: '#f6f7fb', paper: 'rgba(255,255,255,0.6)' },
            surface: { main: 'rgba(255,255,255,0.6)' }
          }
        : {
            primary: { main: '#9A8CFF' },
            secondary: { main: '#3CE6C3' },
            background: { default: '#0b0f14', paper: 'rgba(20,24,30,0.45)' },
            surface: { main: 'rgba(20,24,30,0.45)' }
          })
    },
    typography: {
      fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'].join(','),
      h6: { fontWeight: 600 },
      body1: { fontSize: '0.98rem' }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 6px 18px rgba(18, 24, 40, 0.06)'
          }
        }
      }
    }
  })

export type AppTheme = ReturnType<typeof getTheme>

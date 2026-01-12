import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import App from './App'
import { store } from './redux/store'
import { getTheme } from './theme'
import { startSync } from './firebase'

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <Provider store={store}>
  {/* Use theme generator; default will pick light mode. */}
  <ThemeProvider theme={getTheme()}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
)

// start Firestore sync (anonymous auth + realtime updates)
startSync(store)

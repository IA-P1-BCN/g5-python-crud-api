import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'
import '@fontsource/big-shoulders-display/latin-700'
import '@fontsource/big-shoulders-display/latin-900'
import '@fontsource/hanken-grotesk/latin-400'
import '@fontsource/hanken-grotesk/latin-500'
import '@fontsource/hanken-grotesk/latin-700'
import '@fontsource/share-tech-mono/latin-400'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

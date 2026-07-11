import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (bundled with the app — no external font CDN needed).
// Noto Sans Khmer: UI text, full Khmer shaping. Moul: Khmer display.
// Playfair Display: Latin display paired with Moul.
import '@fontsource/noto-sans-khmer/400.css'
import '@fontsource/noto-sans-khmer/500.css'
import '@fontsource/noto-sans-khmer/600.css'
import '@fontsource/noto-sans-khmer/700.css'
import '@fontsource/moul/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import './index.css'
import App from './App.jsx'

import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
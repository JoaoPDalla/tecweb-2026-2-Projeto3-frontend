import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import StaticScreensPreview from './StaticScreensPreview'

// Entrada independente para revisar as #5, #10 e #18 sem substituir o App.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StaticScreensPreview />
  </StrictMode>,
)

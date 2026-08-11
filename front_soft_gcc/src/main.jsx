import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { setupGlobalAuthErrorHandling } from './helpers/setupAuthErrorHandling'

setupGlobalAuthErrorHandling()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

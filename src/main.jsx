import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import './index.css'

// Security note for production integrations:
// frontend-visible API keys are never secrets. Restrict Google Maps keys by domain/API/quota,
// and keep Siigo tokens, GCP service accounts, and other private credentials behind a backend/Secret Manager.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
)

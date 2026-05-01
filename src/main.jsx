import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { queryClient } from './hooks/queryClient.js'
import './index.css'

// Security note for production integrations:
// frontend-visible API keys are never secrets. Restrict Google Maps keys by domain/API/quota,
// and keep Siigo tokens, GCP service accounts, and other private credentials behind a backend/Secret Manager.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)

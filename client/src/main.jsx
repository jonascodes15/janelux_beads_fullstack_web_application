import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#111111',
              color: '#F5EDD6',
              border: '1px solid #2A2A2A',
              borderRadius: '0',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.05em',
            },
            success: { iconTheme: { primary: '#C9993F', secondary: '#0A0A0A' } },
            error: { iconTheme: { primary: '#8B2E1A', secondary: '#F5EDD6' } },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

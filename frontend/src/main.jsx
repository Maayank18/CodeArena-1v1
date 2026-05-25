import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { AuthSessionProvider } from './context/AuthSessionContext.jsx';
import { AppSocketProvider } from './context/AppSocketContext.jsx';
import './index.css';
import { Analytics } from "@vercel/analytics/react";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthSessionProvider>
        <ThemeProvider>
          <AppSocketProvider>
            <Toaster position="top-right" />
            <App />
            <Analytics />
          </AppSocketProvider>
        </ThemeProvider>
      </AuthSessionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
// V 1.5

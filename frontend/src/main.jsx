import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import { Analytics } from "@vercel/analytics/react";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Toaster position="top-right" />
        <App />
        <Analytics />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
// V 1.5

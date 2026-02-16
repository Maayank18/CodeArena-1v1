import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext'; // Import
import './index.css';
import { Analytics } from "@vercel/analytics/next";

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <ThemeProvider> {/* WRAP HERE */}
        <Toaster position="top-right" />
        <App />
        <Analytics />
      </ThemeProvider>
    </BrowserRouter>
);
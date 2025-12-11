import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './MainApp';
import './index.css';

// This is the standard entry point for a React app using Vite/CRA.
// It renders the root component and imports the global styles (Tailwind).

console.log("Main.jsx: Attempting to render root");

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
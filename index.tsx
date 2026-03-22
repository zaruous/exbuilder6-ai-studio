
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = (rootElement as any)._reactRoot ?? ReactDOM.createRoot(rootElement);
(rootElement as any)._reactRoot = root;
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

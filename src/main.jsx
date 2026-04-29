import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HookProvider } from './context/HookContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HookProvider>
      <App />
    </HookProvider>
  </StrictMode>,
);

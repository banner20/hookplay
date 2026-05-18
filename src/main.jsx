import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HookProvider } from './context/HookContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <HookProvider>
        <App />
      </HookProvider>
    </AuthProvider>
  </StrictMode>,
);

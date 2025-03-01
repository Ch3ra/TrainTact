import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
<GoogleOAuthProvider clientId="826625986020-jgj52tv8m5ohip8h4nju3k4tk6aa8c0f.apps.googleusercontent.com">
   <App />
</GoogleOAuthProvider>;
   
  </StrictMode>,
)

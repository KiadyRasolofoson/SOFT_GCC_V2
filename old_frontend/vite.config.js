import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'a611-2605-59c0-5ef4-db10-2906-df1f-1411-6a96.ngrok-free.app', // Ajoutez l'URL de ngrok ici
    ],
  },
})

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  server: {
    proxy: {
      '/api_v1': {
        target: 'http://34.123.227.162:8080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api_v1/, '/api')
      },
      '/graphql_api': {
        target: 'http://34.28.246.100:4000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/graphql_api/, '/')
      }
    }
  },

  test: {                     // <--- Mueve "test" fuera de "server"
    environment: 'jsdom',     // Necesario para que document esté definido
    globals: true,            // Para usar expect, describe, it sin importarlos
    setupFiles: './src/setupTests.js',
  }
});

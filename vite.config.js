// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para REST API
      '/api_v1': {
        target: 'http://34.123.227.162:8080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api_v1/, '/api')
      },
      // Proxy para GraphQL API
      '/graphql_api': {
        target: 'http://34.28.246.100:4000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/graphql_api/, '/')
      }
    }
  }
});

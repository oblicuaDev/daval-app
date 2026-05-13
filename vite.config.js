import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunks: vendor splits so each role-bundle doesn't ship all of node_modules
        manualChunks: {
          // recharts + d3 + victory son el bloque más grande (~300 KB) — chunk propio
          'vendor-charts': ['recharts'],
          // Todo el árbol de React en un chunk para evitar ciclos entre chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
        // Consistent chunk naming for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 400,
  },

  // Pre-bundle for faster cold starts in dev
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
});

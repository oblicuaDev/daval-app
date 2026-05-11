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
        manualChunks(id) {
          // recharts + d3 deps (largest dependency ~300 KB)
          if (id.includes('/node_modules/recharts') || id.includes('/node_modules/d3-') || id.includes('/node_modules/victory-')) {
            return 'vendor-charts';
          }
          // React core
          if (id.includes('/node_modules/react-dom/')) return 'vendor-react-dom';
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-router')) return 'vendor-react';
          // TanStack Query
          if (id.includes('/node_modules/@tanstack/')) return 'vendor-query';
          // Icons (lucide-react tree-shakes well but still benefits from its own chunk)
          if (id.includes('/node_modules/lucide-react/')) return 'vendor-icons';
          // HTTP client
          if (id.includes('/node_modules/axios/')) return 'vendor-http';
          // Everything else in node_modules
          if (id.includes('/node_modules/')) return 'vendor';
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

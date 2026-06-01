import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/playwright-report/**', '**/test-results/**']
      }
    },
    plugins: [
      react(), 
      tailwindcss(),
      viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
      viteCompression({ algorithm: 'gzip', ext: '.gz' })
    ],
    define: {
      // Support legacy process.env.API_KEY pattern used in some files
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      // Raise the warning limit so large chunks are allowed if unavoidable
      chunkSizeWarningLimit: 1000,
      // Remove source maps in production for smaller bundles
      sourcemap: false,
      // Enable CSS code splitting for parallel loading
      cssCodeSplit: true,
      // Minification with terser for better tree-shaking
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.warn'],
        },
      },
      rollupOptions: {
        output: {
          // Code-split large vendor libraries into separate chunks
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ai': ['@google/genai'],
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
          },
          // Content-hash filenames for long-term caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

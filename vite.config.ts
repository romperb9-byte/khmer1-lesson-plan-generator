import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    // The platform injects GEMINI_API_KEY into the environment.
    // We prioritize the environment variable, but bake in the user's key as a fallback at build time.
    let apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

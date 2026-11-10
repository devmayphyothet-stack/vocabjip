import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Shared profile validation lives outside Studio. Use Studio's compiler settings
  // for it too, without requiring the mobile app's Expo packages in this build.
  esbuild: {
    tsconfigRaw: readFileSync(path.resolve(__dirname, 'tsconfig.json'), 'utf8'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});


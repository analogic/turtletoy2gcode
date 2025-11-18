import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

// Vite config to bundle Monaco locally (workers, languages, and CSS)
export default defineConfig({
  base: '/turtletoy2gcode/',
  plugins: [
    monacoEditorPlugin({
      // Include only what we need to keep the bundle small
      languages: ['javascript'],
      features: ['!accessibilityHelp'],
    }),
  ],
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
    copyPublicDir: true,
  },
});

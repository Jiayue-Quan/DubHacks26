import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/DubHacks26/',   // the site lives at jiayue-quan.github.io/DubHacks26/
});

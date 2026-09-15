import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Default export required by Vite (standards 6.2 framework exception).
export default defineConfig({
  plugins: [react()],
});

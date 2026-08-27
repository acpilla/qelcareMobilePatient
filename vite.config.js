import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const jsAsJsx = {
  name: 'qelcare-js-as-jsx',
  async transform(code, id) {
    if (!id.includes('/src/') || !id.endsWith('.js')) return null;
    return transformWithEsbuild(code, id, {
      loader: 'jsx',
      jsx: 'automatic',
    });
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || env.REACT_APP_API_URL || '';
  return {
    plugins: [jsAsJsx, react()],
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(apiUrl),
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 3000,
    },
  };
});

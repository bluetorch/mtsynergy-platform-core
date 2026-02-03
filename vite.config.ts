import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'types/index': resolve(__dirname, 'src/types/index.ts'),
        'constants/index': resolve(__dirname, 'src/constants/index.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});

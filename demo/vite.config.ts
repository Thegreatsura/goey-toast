import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Use local source in dev, npm package on Vercel
const localSrc = path.resolve(__dirname, '../src/index.ts')
const localCss = path.resolve(__dirname, '../src/components/GoeyToast.module.css')
const useLocalSource = fs.existsSync(localSrc)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ...(useLocalSource
        ? {
            'goey-toast/styles.css': localCss,
            'goey-toast': localSrc,
          }
        : {}),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
    },
  },
})

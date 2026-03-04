import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useHttps = env.VITE_USE_HTTPS === 'true';
  const keyPath = env.VITE_HTTPS_KEY || './certs/localhost-key.pem';
  const certPath = env.VITE_HTTPS_CERT || './certs/localhost.pem';

  const httpsOptions = useHttps && fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? {
        key: fs.readFileSync(path.resolve(keyPath)),
        cert: fs.readFileSync(path.resolve(certPath)),
      }
    : false;

  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      https: httpsOptions,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

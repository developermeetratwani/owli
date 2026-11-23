import { defineConfig } from 'vite';
import { handleApi } from './backend/api.js';

export default defineConfig({
  plugins: [{
    name: 'owli-demo-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        Promise.resolve(handleApi(req, res)).then(handled => {
          if (!handled) next();
        }).catch(next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        Promise.resolve(handleApi(req, res)).then(handled => {
          if (!handled) next();
        }).catch(next);
      });
    },
  }],
});

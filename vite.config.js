import { defineConfig } from 'vite';
import { handleApi } from './backend/api.js';

function denyPrivateFiles(req, res, next) {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replaceAll('\\', '/');
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (/(^|\/)\.data(\/|$)/i.test(path)) {
    res.writeHead(404);
    res.end();
    return;
  }
  next();
}

export default defineConfig({
  server: { fs: { deny: ['**/.data/**'] } },
  plugins: [{
    name: 'owli-demo-api',
    configureServer(server) {
      server.middlewares.use(denyPrivateFiles);
      server.middlewares.use((req, res, next) => {
        Promise.resolve(handleApi(req, res)).then(handled => {
          if (!handled) next();
        }).catch(next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(denyPrivateFiles);
      server.middlewares.use((req, res, next) => {
        Promise.resolve(handleApi(req, res)).then(handled => {
          if (!handled) next();
        }).catch(next);
      });
    },
  }],
});

// Función serverless de Vercel: reutiliza la app NestJS compilada en dist/
// (la construye `npm run build` en el paso de build) y la inicializa una sola
// vez por instancia; las peticiones siguientes reciben la app ya caliente.
const { createApp } = require('../dist/app.factory');

let serverPromise;

function getServer() {
  if (!serverPromise) {
    serverPromise = createApp()
      .then(async (app) => {
        await app.init();
        return app.getHttpAdapter().getInstance();
      })
      .catch((err) => {
        serverPromise = undefined; // permitir reintento en la siguiente petición
        throw err;
      });
  }
  return serverPromise;
}

module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};

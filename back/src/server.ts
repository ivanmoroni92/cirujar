import './loadEnv';
import app from './app';
import { connectDB } from './config/database';
import { resolveApiUrl, resolveBaseUrl } from './config/readDevConfig';

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`🌐 Base URL (from _config.js): ${resolveBaseUrl()}`);
    console.log(`🌐 API URL (from _config.js): ${resolveApiUrl()}`);
  });
});

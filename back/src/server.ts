import './loadEnv';
import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3000;


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  });
});

import mongoose from 'mongoose';
import { resolveMongoUri } from './resolveMongoUri';

/**
 * conexión con MongoDB 
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = resolveMongoUri();

    await mongoose.connect(mongoUri);
    console.log(
      `✅ MongoDB conectado → host: ${mongoose.connection.host}, db: ${mongoose.connection.name}`
    );
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1); // Detener el servidor si no hay conexión a la base de datos
  }
};

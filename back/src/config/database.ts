import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno 
dotenv.config();

/**
 * conexión con MongoDB 
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI no está definido en las variables de entorno');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Base de datos MongoDB conectada exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1); // Detener el servidor si no hay conexión a la base de datos
  }
};

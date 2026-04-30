import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interfaz TypeScript que describe la forma del documento Product.
 * Actúa como contrato tipado para todo el sistema de capas.
 */
export interface IProduct extends Document {
  titulo: string;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number]; // [longitud, latitud]
  };
  detalles: string;
  fotos: string[];
}

/**
 * Schema de Mongoose para la colección 'products'.
 * Usa el tipo GeoJSON Point para la ubicación,
 * lo que permite queries geoespaciales con $near, $geoWithin, etc.
 */
const ProductSchema: Schema = new Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    ubicacion: {
      type: {
        type: String,
        enum: ['Point'], // GeoJSON exige que sea exactamente 'Point'
        required: true,
      },
      coordinates: {
        type: [Number], // [longitud, latitud]
        required: true,
      },
    },
    detalles: {
      type: String,
      trim: true,
      default: '',
    },
    fotos: {
      type: [String], // Array de URLs
      default: [],
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índice geoespacial: permite consultas de cercanía en MongoDB
ProductSchema.index({ ubicacion: '2dsphere' });

export default mongoose.model<IProduct>('Product', ProductSchema);

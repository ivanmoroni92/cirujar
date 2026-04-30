import mongoose, { Schema, Document } from 'mongoose';


export interface IProduct extends Document {
  titulo: string;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number]; // [longitud, latitud]
  };
  detalles: string;
  fotos: string[];
}

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
    timestamps: true,
  }
);

ProductSchema.index({ ubicacion: '2dsphere' });

export default mongoose.model<IProduct>('Product', ProductSchema);

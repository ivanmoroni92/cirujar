import mongoose, { Schema, Document } from 'mongoose';


export interface IProduct extends Document {
  titulo: string;
  ubicacion?: {
    type: 'Point';
    coordinates: [number, number];
  };
  ubicacionTexto?: string;
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
    ubicacionTexto: {
      type: String,
      trim: true,
    },
    ubicacion: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
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

ProductSchema.index({ ubicacion: '2dsphere' }, { sparse: true });

export default mongoose.model<IProduct>('Product', ProductSchema);

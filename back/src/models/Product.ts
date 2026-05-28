import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductUsuario {
  _id: Types.ObjectId;
  alias: string;
  imagenPerfil?: string;
}

export interface IProduct extends Document {
  titulo: string;
  ubicacion?: {
    type: 'Point';
    coordinates: [number, number];
  };
  ubicacionTexto?: string;
  detalles: string;
  fotos: string[];
  usuario?: Types.ObjectId | IProductUsuario;
  estado: 'disponible' | 'retirado';
  retirado?: {
    user: Types.ObjectId | IProductUsuario;
    at: Date;
  };
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
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    estado: {
      type: String,
      enum: ['disponible', 'retirado'],
      default: 'disponible',
    },
    retirado: {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      at: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ ubicacion: '2dsphere' }, { sparse: true });

export default mongoose.model<IProduct>('Product', ProductSchema);

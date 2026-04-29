import mongoose, { Schema, Document } from 'mongoose';

// Usamos Strict: false para permitir campos dinámicos
// Puedes extender esta interfaz con los campos que necesites luego
export interface IProduct extends Document {
  [key: string]: any;
}

const ProductSchema: Schema = new Schema({
  // Campos base (opcional, puedes agregar o quitar)
  // name: { type: String, required: true },
}, { 
  strict: false, // Permite guardar cualquier campo en el documento
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

export default mongoose.model<IProduct>('Product', ProductSchema);

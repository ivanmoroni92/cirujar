import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  alias: string;
  email: string;
  contraseña: string;
  imagenPerfil?: string;
}

const UserSchema: Schema = new Schema(
  {
    alias: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contraseña: {
      type: String,
      required: true,
      select: false,
    },
    imagenPerfil: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const plain = ret as Record<string, unknown>;
        delete plain.contraseña;
        delete plain.__v;
        return plain;
      },
    },
  }
);

export default mongoose.model<IUser>('User', UserSchema);

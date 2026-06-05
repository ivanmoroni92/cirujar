import UserDAO from '../dao/UserDAO';
import { hashPassword } from '../utils/passwordHash';
import StorageService from './StorageService';

export interface CreateUserInput {
  alias: string;
  email: string;
  contraseña: string;
  imagenPerfil?: string;
}

export interface UpdateUserInput {
  alias?: string;
  email?: string;
  contraseña?: string;
  imagenPerfil?: string;
}

class UserService {
  async getAllUsers() {
    return await UserDAO.findAll();
  }

  async getUserById(id: string) {
    return await UserDAO.findById(id);
  }

  async createUser(data: CreateUserInput) {
    const hashed = hashPassword(data.contraseña);
    return await UserDAO.create({
      alias: data.alias.trim(),
      email: data.email.trim().toLowerCase(),
      contraseña: hashed,
      imagenPerfil: data.imagenPerfil?.trim() ?? '',
    });
  }

  async updateUser(id: string, data: UpdateUserInput) {
    // Si viene una imagen nueva, borrar la vieja del disco
    if (data.imagenPerfil !== undefined) {
      const user = await UserDAO.findById(id);
      if (user?.imagenPerfil) {
        await StorageService.deleteImage(user.imagenPerfil);
      }
    }

    const payload: Record<string, unknown> = {};

    if (data.alias !== undefined) {
      payload.alias = data.alias.trim();
    }
    if (data.email !== undefined) {
      payload.email = data.email.trim().toLowerCase();
    }
    if (data.contraseña !== undefined && data.contraseña.length > 0) {
      payload.contraseña = hashPassword(data.contraseña);
    }
    if (data.imagenPerfil !== undefined) {
      payload.imagenPerfil = data.imagenPerfil.trim();
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('No hay campos para actualizar.');
    }

    const updated = await UserDAO.update(id, payload);
    if (!updated) {
      throw new Error('Usuario no encontrado.');
    }
    return updated;
  }
}

export default new UserService();

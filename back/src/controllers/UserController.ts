import { Request, Response } from 'express';
import UserService from '../services/UserService';
import { isValidEmailFormat } from '../utils/emailFormat';

const MIN_PASSWORD_LEN = 6;
const DUPLICATE_EMAIL_MSG = 'Este email ya tiene una cuenta';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

class UserController {
  /**
   * GET /api/users — list users (no passwords).
   */
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar usuarios';
      res.status(500).json({ error: message });
    }
  }

  /**
   * GET /api/users/:id — one user (no password).
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await UserService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json(user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener usuario';
      res.status(500).json({ error: message });
    }
  }

  /**
   * POST /api/users — JSON: alias, email, contraseña, imagenPerfil (optional).
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { alias, email, contraseña, imagenPerfil } = req.body ?? {};

      if (!isNonEmptyString(alias) || !isNonEmptyString(email) || !isNonEmptyString(contraseña)) {
        res.status(400).json({
          error: 'alias, email y contraseña son obligatorios.',
        });
        return;
      }

      if (!isValidEmailFormat(email)) {
        res.status(400).json({ error: 'Ingresá un email válido' });
        return;
      }

      if (contraseña.length < MIN_PASSWORD_LEN) {
        res
          .status(400)
          .json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }

      const user = await UserService.createUser({
        alias,
        email,
        contraseña,
        imagenPerfil: typeof imagenPerfil === 'string' ? imagenPerfil : undefined,
      });

      res.status(201).json(user);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ error: DUPLICATE_EMAIL_MSG });
        return;
      }
      const message = error instanceof Error ? error.message : 'Error al crear usuario';
      res.status(400).json({ error: message });
    }
  }

  /**
   * PATCH /api/users/:id — JSON: any of alias, email, contraseña, imagenPerfil.
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { alias, email, contraseña, imagenPerfil } = req.body ?? {};

      const data: {
        alias?: string;
        email?: string;
        contraseña?: string;
        imagenPerfil?: string;
      } = {};

      if (alias !== undefined) {
        if (!isNonEmptyString(alias)) {
          res.status(400).json({ error: 'alias no puede estar vacío.' });
          return;
        }
        data.alias = alias;
      }
      if (email !== undefined) {
        if (!isNonEmptyString(email)) {
          res.status(400).json({ error: 'email no puede estar vacío.' });
          return;
        }
        if (!isValidEmailFormat(email)) {
          res.status(400).json({ error: 'Ingresá un email válido' });
          return;
        }
        data.email = email;
      }
      if (contraseña !== undefined) {
        if (!isNonEmptyString(contraseña)) {
          res.status(400).json({ error: 'contraseña no puede estar vacía si se envía.' });
          return;
        }
        if (contraseña.length < MIN_PASSWORD_LEN) {
          res
            .status(400)
            .json({ error: 'La contraseña debe tener al menos 6 caracteres' });
          return;
        }
        data.contraseña = contraseña;
      }
      if (imagenPerfil !== undefined) {
        data.imagenPerfil = typeof imagenPerfil === 'string' ? imagenPerfil : '';
      }

      const user = await UserService.updateUser(id, data);
      res.status(200).json(user);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ error: DUPLICATE_EMAIL_MSG });
        return;
      }
      const message = error instanceof Error ? error.message : 'Error al actualizar';
      const status = message === 'Usuario no encontrado.' ? 404 : 400;
      res.status(status).json({ error: message });
    }
  }
}

export default new UserController();
